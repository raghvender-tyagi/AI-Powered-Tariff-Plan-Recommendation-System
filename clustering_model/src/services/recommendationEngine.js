const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const FEATURES_PATH = path.join(__dirname, "../../../data/processed/customer_features.csv");
const CLUSTERS_PATH = path.join(__dirname, "../../../data/processed/customer_clusters.csv");
const PROFILES_PATH = path.join(__dirname, "../../../data/processed/cluster_profiles.json");
const CATALOG_PATH = path.join(__dirname, "../../../data/processed/plan_catalog.json");
const OUTPUT_PATH = path.join(__dirname, "../../../data/processed/recommendation_sample.json");

const PERSONAL_CATEGORIES = ["FLEX", "PLAY", "PRIME"];

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", row => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function pctScore(actual, allowance, tolerance = 1.0) {
  if (!Number.isFinite(allowance) || allowance <= 0) return 0;
  const ratio = actual / allowance;
  if (ratio <= 1) return clamp(ratio);
  return clamp(1 - ((ratio - 1) / tolerance));
}

function priceScore(monthlyRecharge, planPrice) {
  if (!planPrice || planPrice <= 0) return 0;
  if (!monthlyRecharge || monthlyRecharge <= 0) return 0.65;
  const ratio = planPrice / monthlyRecharge;

  if (ratio <= 0.85) return 0.95;
  if (ratio <= 1.00) return 0.90;
  if (ratio <= 1.15) return 0.78;
  if (ratio <= 1.35) return 0.60;
  if (ratio <= 1.60) return 0.40;
  return 0.20;
}

function validityScore(planDays) {
  if (planDays >= 365) return 1.0;
  if (planDays >= 180) return 0.95;
  if (planDays >= 84) return 0.85;
  if (planDays >= 56) return 0.75;
  return 0.60;
}

function benefitScore(customer, plan) {
  let score = 0;
  const streaming = num(customer.streaming_hours);
  const roamingData = num(customer.roaming_data_gb);
  const international = num(customer.international_minutes);

  if (plan.category === "PLAY" && streaming >= 25) score += 0.8;
  if (plan.category === "PRIME" && (streaming >= 50 || num(customer.monthly_recharge) >= 600)) score += 0.7;
  if (plan.category === "FLEX" && streaming < 25) score += 0.5;
  if (roamingData >= 2 && plan.features?.some(x => /roaming/i.test(x))) score += 0.9;
  if (international >= 20 && plan.selectableBenefits && plan.benefitOptions?.includes("Roaming")) score += 0.9;

  if (plan.dataBank?.enabled && num(customer.monthly_data_gb) > 10) score += 0.2;
  if (plan.smartBoost?.eligible) score += 0.1;

  return clamp(score);
}

function usageScore(customer, plan) {
  const monthlyData = num(customer.monthly_data_gb);
  const streaming = num(customer.streaming_hours);
  const hotspot = num(customer.hotspot_data_gb);
  const voice = num(customer.monthly_voice_minutes);

  if (plan.category === "FAMILY" || plan.category === "BUSINESS") return 0;

  const dataAllowance = num(plan.dataGbTotal);
  const dataScore = dataAllowance > 0 ? pctScore(monthlyData, dataAllowance, 1.5) : 0;

  // Streaming is a behavior signal; it should influence the score but not dominate data.
  const streamingScore =
    plan.category === "PLAY"
      ? clamp(streaming / 80)
      : clamp(streaming / 120);

  const hotspotScore =
    hotspot > 0
      ? clamp(hotspot / Math.max(1, (dataAllowance || 10) * 0.20))
      : 0;

  // Voice is deliberately a smaller signal because the market plans are generally unlimited-voice.
  const voiceScore = clamp(voice / 300);

  return clamp(
    (dataScore * 0.55) +
    (streamingScore * 0.25) +
    (hotspotScore * 0.10) +
    (voiceScore * 0.10)
  );
}

function allowanceScore(customer, plan) {
  if (plan.category === "FAMILY" || plan.category === "BUSINESS") return 0;

  const monthlyData = num(customer.monthly_data_gb);
  const allowance = num(plan.dataGbTotal);

  if (!allowance) return 0;

  // Penalize both severe under-coverage and extreme over-allocation.
  if (monthlyData <= allowance) return clamp(monthlyData / allowance);
  const over = monthlyData / allowance;
  return clamp(1 - ((over - 1) / 1.5));
}

function eligibility(plan, mode, extra = {}) {
  if (mode === "personal") return PERSONAL_CATEGORIES.includes(plan.category);

  if (mode === "family") {
    const members = num(extra.members);
    return plan.category === "FAMILY" && members > 0 && plan.members >= members;
  }

  if (mode === "business") {
    const employees = num(extra.employees);
    return plan.category === "BUSINESS" && employees > 0 && plan.maxEmployees >= employees;
  }

  return false;
}

function scorePlan(customer, plan, mode = "personal", extra = {}) {
  const weights = {
    usageCompatibility: 0.40,
    priceEfficiency: 0.25,
    allowanceCoverage: 0.20,
    benefitMatch: 0.10,
    validityMatch: 0.05
  };

  const usage = mode === "personal" ? usageScore(customer, plan) : 0.75;
  const price = priceScore(num(customer.monthly_recharge), plan.price);
  const allowance = mode === "personal" ? allowanceScore(customer, plan) : 0.75;
  const benefits = mode === "personal" ? benefitScore(customer, plan) : 0.75;
  const validity = validityScore(plan.validityDays);

  const score =
    usage * weights.usageCompatibility +
    price * weights.priceEfficiency +
    allowance * weights.allowanceCoverage +
    benefits * weights.benefitMatch +
    validity * weights.validityMatch;

  return {
    usageCompatibility: Number((usage * 100).toFixed(1)),
    priceEfficiency: Number((price * 100).toFixed(1)),
    allowanceCoverage: Number((allowance * 100).toFixed(1)),
    benefitMatch: Number((benefits * 100).toFixed(1)),
    validityMatch: Number((validity * 100).toFixed(1)),
    score: Number((score * 100).toFixed(2))
  };
}

function explanation(customer, plan, scores) {
  const reasons = [];
  const data = num(customer.monthly_data_gb);
  const streaming = num(customer.streaming_hours);
  const recharge = num(customer.monthly_recharge);

  if (scores.usageCompatibility >= 75) {
    reasons.push("strong match to your usage behavior");
  }
  if (scores.priceEfficiency >= 80) {
    reasons.push("price is close to or below your current recharge level");
  }
  if (scores.allowanceCoverage >= 75) {
    reasons.push("allowance covers your observed data usage without excessive capacity");
  }
  if (plan.category === "PLAY" && streaming >= 25) {
    reasons.push("your streaming usage makes the entertainment benefits relevant");
  }
  if (plan.category === "FLEX" && recharge < 450) {
    reasons.push("offers a lower-cost route for a price-sensitive user");
  }
  if (plan.category === "PRIME" && (data >= 25 || recharge >= 650)) {
    reasons.push("fits a higher-value/heavy-usage profile");
  }
  if (reasons.length === 0) reasons.push("balanced overall value across the scoring dimensions");

  return reasons.slice(0, 3);
}

function smartBoostSuggestion(customer, ranked) {
  const top = ranked[0];
  if (!top || !top.plan.smartBoost?.eligible) return null;

  const data = num(customer.monthly_data_gb);
  const allowance = num(top.plan.dataGbTotal);

  if (allowance > 0 && data <= allowance * 1.15) {
    return {
      type: "temporary_boost",
      message: "Your usage is close to the plan allowance. A temporary Smart Boost may be better than permanently upgrading.",
      options: top.plan.smartBoost.options
    };
  }

  return null;
}

function buildRecommendation(customer, plans, mode = "personal", extra = {}) {
  const eligible = plans.filter(p => eligibility(p, mode, extra));

  const ranked = eligible
    .map(plan => {
      const scores = scorePlan(customer, plan, mode, extra);
      return {
        plan,
        ...scores,
        explanation: explanation(customer, plan, scores)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    customerId: customer.customer_id,
    mode,
    behavior: {
      monthlyDataGb: num(customer.monthly_data_gb),
      streamingHours: num(customer.streaming_hours),
      hotspotDataGb: num(customer.hotspot_data_gb),
      monthlyVoiceMinutes: num(customer.monthly_voice_minutes),
      totalCalls: num(customer.total_calls),
      monthlySms: num(customer.monthly_sms),
      internationalMinutes: num(customer.international_minutes),
      roamingDataGb: num(customer.roaming_data_gb),
      monthlyRecharge: num(customer.monthly_recharge),
      tenureMonths: num(customer.tenure_months)
    },
    top3: ranked.map((r, i) => ({
      rank: i + 1,
      planId: r.plan.planId,
      name: r.plan.name,
      category: r.plan.category,
      price: r.plan.price,
      validityDays: r.plan.validityDays,
      dailyDataGb: r.plan.dailyDataGb,
      dataGbTotal: r.plan.dataGbTotal,
      score: r.score,
      scoreBreakdown: {
        usageCompatibility: r.usageCompatibility,
        priceEfficiency: r.priceEfficiency,
        allowanceCoverage: r.allowanceCoverage,
        benefitMatch: r.benefitMatch,
        validityMatch: r.validityMatch
      },
      explanation: r.explanation,
      features: r.plan.features || [],
      benefits: r.plan.benefits || []
    })),
    smartBoost: smartBoostSuggestion(customer, ranked)
  };
}

async function main() {
  const [customers, clusterRows] = await Promise.all([
    readCSV(FEATURES_PATH),
    readCSV(CLUSTERS_PATH)
  ]);

  const profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8"));
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));

  const clusterMap = new Map(
    clusterRows.map(r => [r.customer_id, num(r.cluster)])
  );

  // Demo the first customer. The API can call buildRecommendation()
  // for any customer_id later.
  const customer = customers[0];
  const cluster = clusterMap.get(customer.customer_id);

  const result = buildRecommendation(
    customer,
    catalog.plans,
    "personal"
  );

  result.cluster = cluster;
  result.clusterPersona =
    profiles.clusters?.[String(cluster)]?.preliminaryPersona || "Unknown";

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(result, null, 2),
    "utf8"
  );

  console.log("\n========================================");
  console.log("       SMART TARIFF RECOMMENDATION");
  console.log("========================================");
  console.log("Customer:", result.customerId);
  console.log("Cluster:", result.cluster);
  console.log("Persona:", result.clusterPersona);

  console.log("\n---------- BEHAVIOR ----------");
  console.log("Data:", result.behavior.monthlyDataGb, "GB/month");
  console.log("Streaming:", result.behavior.streamingHours, "hours/month");
  console.log("Hotspot:", result.behavior.hotspotDataGb, "GB/month");
  console.log("Voice:", result.behavior.monthlyVoiceMinutes, "minutes/month");
  console.log("Recharge: ₹" + result.behavior.monthlyRecharge);

  console.log("\n---------- TOP 3 ----------");
  result.top3.forEach(p => {
    console.log(`#${p.rank} ${p.name} | ${p.category} | ₹${p.price} | Score ${p.score}/100`);
    console.log("   Why:", p.explanation.join("; "));
  });

  if (result.smartBoost) {
    console.log("\nSmart Boost:", result.smartBoost.message);
    console.log("Options:", result.smartBoost.options.join(", "));
  }

  console.log("\nOutput:", OUTPUT_PATH);
  console.log("========================================\n");
}

module.exports = {
  buildRecommendation,
  scorePlan,
  eligibility
};

if (require.main === module) {
  main().catch(err => {
    console.error("\nRECOMMENDATION ENGINE ERROR:", err.message);
    process.exit(1);
  });
}
