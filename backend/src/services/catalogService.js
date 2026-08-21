const fs = require("fs");
const env = require("../config/env");

/**
 * Reads the Group 2 outputs (25-plan catalogue, plan -> cluster mapping,
 * cluster profiles) and normalises them into the documents the API and the
 * React client consume. Every field below is either copied verbatim from
 * those files or derived from them by a stated arithmetic rule — nothing is
 * invented.
 */

const CATEGORY_META = {
  FLEX: {
    label: "Flex",
    color: "#22d3ee",
    blurb: "Low-cost daily-data packs for light and moderate personal use."
  },
  PLAY: {
    label: "Play",
    color: "#a78bfa",
    blurb: "Entertainment-led packs bundling music and OTT benefits."
  },
  FAMILY: {
    label: "Family",
    color: "#34d399",
    blurb: "Shared daily data pools across multiple family members."
  },
  BUSINESS: {
    label: "Business",
    color: "#fbbf24",
    blurb: "Pooled data and central management for teams and enterprises."
  },
  PRIME: {
    label: "Prime",
    color: "#f472b6",
    blurb: "Premium high-allowance packs with long validity and choice of benefits."
  }
};

const CLUSTER_COLORS = ["#60a5fa", "#22d3ee", "#34d399", "#fbbf24", "#a78bfa"];

const readJson = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required data file missing: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const DAYS_PER_MONTH = 30;

function allowanceOf(plan) {
  if (plan.dailySharedPoolGb !== undefined && plan.dailySharedPoolGb !== null) {
    return { allowanceType: "shared_pool", dailyDataGb: Number(plan.dailySharedPoolGb) };
  }
  if (plan.dailyPoolGb !== undefined && plan.dailyPoolGb !== null) {
    return { allowanceType: "business_pool", dailyDataGb: Number(plan.dailyPoolGb) };
  }
  return { allowanceType: "personal", dailyDataGb: Number(plan.dailyDataGb ?? 0) };
}

/** Factual restatements of catalogue fields — no invented entitlements. */
function benefitsOf(plan, allowance) {
  const benefits = [];

  const poolLabel =
    allowance.allowanceType === "shared_pool"
      ? "shared daily data"
      : allowance.allowanceType === "business_pool"
        ? "pooled daily data"
        : "daily data";

  benefits.push(`${allowance.dailyDataGb} GB/day ${poolLabel}`);
  benefits.push(`${plan.validityDays}-day validity`);

  if (plan.members) benefits.push(`Covers up to ${plan.members} family members`);
  if (plan.employees) benefits.push(`Covers up to ${plan.employees} employees`);
  if (plan.differentiator) benefits.push(plan.differentiator);

  return benefits;
}

/**
 * Relative tiers computed from the catalogue's own distribution (quartiles
 * across the 25 plans). These are descriptions of where a plan sits inside
 * this portfolio, not claims about the wider market.
 */
function tierFor(value, sortedValues, labels) {
  const rank = sortedValues.filter((item) => item < value).length / sortedValues.length;
  if (rank < 0.25) return labels[0];
  if (rank < 0.5) return labels[1];
  if (rank < 0.75) return labels[2];
  return labels[3];
}

const PRICE_TIER_WORDS = {
  budget: "budget, cheap, low price, entry level",
  affordable: "affordable, value, mid low price",
  "mid-range": "mid range price",
  premium: "premium, high end, top tier price"
};

const DATA_TIER_WORDS = {
  light: "light data usage, small allowance, occasional browsing",
  moderate: "moderate data usage, everyday browsing and social media",
  heavy: "heavy data usage, regular streaming",
  "very heavy": "very heavy data usage, constant streaming, gaming, hotspot"
};

function buildPlans() {
  const catalog = readJson(env.paths.planCatalog);
  const mapping = readJson(env.paths.planClusterMapping);

  if (!Array.isArray(catalog.plans) || catalog.plans.length !== 25) {
    throw new Error(
      `plan_catalog.json must contain exactly 25 plans, found ${catalog.plans?.length}`
    );
  }

  if (!Array.isArray(mapping.mappings) || mapping.mappings.length !== 25) {
    throw new Error(
      `plan_cluster_mapping.json must contain exactly 25 mappings, found ${mapping.mappings?.length}`
    );
  }

  const byPlanId = new Map(mapping.mappings.map((item) => [item.planId, item]));

  const allPrices = catalog.plans.map((plan) => Number(plan.price)).sort((a, b) => a - b);
  const allData = catalog.plans
    .map((plan) => allowanceOf(plan).dailyDataGb)
    .sort((a, b) => a - b);

  return catalog.plans.map((plan) => {
    const link = byPlanId.get(plan.id);

    if (!link) {
      throw new Error(`No cluster mapping found for plan ${plan.id}`);
    }

    const allowance = allowanceOf(plan);
    const monthlyDataGb = Number((allowance.dailyDataGb * DAYS_PER_MONTH).toFixed(2));
    const benefits = benefitsOf(plan, allowance);
    const meta = CATEGORY_META[plan.category] ?? { label: plan.category, color: "#94a3b8" };

    const priceTier = tierFor(Number(plan.price), allPrices, [
      "budget",
      "affordable",
      "mid-range",
      "premium"
    ]);

    const dataTier = tierFor(allowance.dailyDataGb, allData, [
      "light",
      "moderate",
      "heavy",
      "very heavy"
    ]);

    const searchText = [
      plan.name,
      plan.category,
      meta.label,
      meta.blurb,
      plan.differentiator,
      `${plan.price} rupees`,
      PRICE_TIER_WORDS[priceTier],
      DATA_TIER_WORDS[dataTier],
      `${allowance.dailyDataGb} GB per day`,
      `${monthlyDataGb} GB per month`,
      `${plan.validityDays} days validity`,
      plan.members ? `${plan.members} family members, shared pool, household` : "",
      plan.employees ? `${plan.employees} employees, team, company, enterprise` : "",
      link.persona
    ]
      .filter(Boolean)
      .join(". ");

    return {
      _id: plan.id,
      planId: plan.id,
      planName: plan.name,
      category: plan.category,
      categoryLabel: meta.label,
      categoryColor: meta.color,
      price: Number(plan.price),
      validityDays: Number(plan.validityDays),
      differentiator: plan.differentiator ?? "",

      priceTier,
      dataTier,

      allowanceType: allowance.allowanceType,
      dailyDataGb: allowance.dailyDataGb,
      monthlyDataGb,
      dataGB: monthlyDataGb, // alias kept for the client's plan shape
      members: plan.members ?? null,
      employees: plan.employees ?? null,

      clusterId: Number(link.clusterId),
      clusterIds: [Number(link.clusterId)],
      persona: link.persona,
      personaCustomerCount: link.customerCount,
      personaCustomerPercentage: link.customerPercentage,

      benefits,
      searchText,
      pricePerGb: monthlyDataGb > 0 ? Number((plan.price / monthlyDataGb).toFixed(2)) : null
    };
  });
}

function describeTraits(averages, overall) {
  const level = (value, base) => {
    if (!base) return "Medium";
    const ratio = value / base;
    if (ratio >= 1.75) return "Very High";
    if (ratio >= 1.2) return "High";
    if (ratio >= 0.8) return "Medium";
    if (ratio >= 0.5) return "Low";
    return "Very Low";
  };

  return {
    data: level(averages.monthly_data_gb, overall.monthly_data_gb),
    streaming: level(averages.streaming_hours, overall.streaming_hours),
    calling: level(averages.monthly_voice_minutes, overall.monthly_voice_minutes),
    sms: level(averages.monthly_sms, overall.monthly_sms),
    roaming: level(averages.roaming_data_gb, overall.roaming_data_gb),
    spend: level(averages.monthly_recharge, overall.monthly_recharge)
  };
}

function describeCluster(cluster, overall, traits) {
  const round = (value, decimals = 1) => Number(Number(value).toFixed(decimals));

  return (
    `${cluster.customerCount.toLocaleString("en-IN")} customers ` +
    `(${cluster.customerPercentage}% of the base). ` +
    `Averages ${round(cluster.averages.monthly_data_gb)} GB of data, ` +
    `${round(cluster.averages.streaming_hours)} streaming hours and ` +
    `${round(cluster.averages.monthly_voice_minutes)} voice minutes a month, ` +
    `on a mean recharge of Rs ${round(cluster.averages.monthly_recharge, 0)}. ` +
    `Data usage is ${traits.data.toLowerCase()} and calling is ${traits.calling.toLowerCase()} ` +
    `relative to the overall base average of ${round(overall.monthly_data_gb)} GB.`
  );
}

function buildClusters() {
  const profiles = readJson(env.paths.clusterProfiles);
  const overall = profiles.overallAverages;

  let artifacts = null;
  if (fs.existsSync(env.paths.modelArtifacts)) {
    artifacts = JSON.parse(fs.readFileSync(env.paths.modelArtifacts, "utf8"));
  }

  return Object.values(profiles.clusters).map((cluster, index) => {
    const traits = describeTraits(cluster.averages, overall);

    return {
      _id: Number(cluster.cluster),
      clusterLabel: Number(cluster.cluster),
      personaName: cluster.preliminaryPersona,
      description: describeCluster(cluster, overall, traits),
      customerCount: cluster.customerCount,
      customerPercentage: cluster.customerPercentage,
      averages: cluster.averages,
      centroid: artifacts?.centroids?.[String(cluster.cluster)] ?? [],
      traits,
      color: CLUSTER_COLORS[index % CLUSTER_COLORS.length]
    };
  });
}

function buildCategories(plans) {
  const seen = new Map();

  for (const plan of plans) {
    if (!seen.has(plan.category)) {
      const meta = CATEGORY_META[plan.category] ?? {};
      seen.set(plan.category, {
        id: plan.category,
        name: meta.label ?? plan.category,
        color: meta.color ?? "#94a3b8",
        blurb: meta.blurb ?? "",
        planCount: 0
      });
    }
    seen.get(plan.category).planCount += 1;
  }

  return [...seen.values()];
}

function modelSummary() {
  const clustering = readJson(env.paths.clusteringReport);
  const alternatives = readJson(env.paths.clusteringAlternatives);
  const pca = readJson(env.paths.pcaReport);

  return {
    algorithm: "K-Means",
    optimalK: clustering.optimalK,
    bestSilhouetteScore: clustering.bestSilhouetteScore,
    silhouetteResults: clustering.silhouetteResults,
    clusterSizes: clustering.clusterSizes,
    features: clustering.features,
    customers: clustering.customers,
    comparison: {
      preferredMethod: alternatives.preferred_method,
      productionMethod: alternatives.production_method,
      conclusion: alternatives.conclusion,
      kmeans: alternatives.kmeans,
      alternative: alternatives.gaussian_alternative
    },
    pca: {
      outputDimensions: pca.output_dimensions,
      explainedVariance: pca.explained_variance,
      totalExplainedVariance: pca.total_explained_variance
    },
    scoringWeights: { usageFit: 0.4, budgetFit: 0.3, personaMatch: 0.3 }
  };
}

// Cached — these files only change when the batch pipeline re-runs.
let cachedPlans = null;
let cachedClusters = null;

module.exports = {
  CATEGORY_META,
  getPlans() {
    if (!cachedPlans) cachedPlans = buildPlans();
    return cachedPlans;
  },
  getClusters() {
    if (!cachedClusters) cachedClusters = buildClusters();
    return cachedClusters;
  },
  getCategories() {
    return buildCategories(this.getPlans());
  },
  modelSummary,
  invalidate() {
    cachedPlans = null;
    cachedClusters = null;
  }
};
