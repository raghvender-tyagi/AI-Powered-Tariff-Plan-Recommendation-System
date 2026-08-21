const store = require("../db/store");
const recommendationService = require("./recommendationService");

/**
 * What-If flow.
 *
 * Runs the SAME recommendation engine twice — once on the baseline profile
 * and once on the simulated profile — and reports the difference. No
 * separate scoring model exists for simulation.
 */

function baselineProfileFromCustomer(customer) {
  const features = customer.features || {};

  return {
    dataNeedGB: features.monthly_data_gb,
    callNeedMin: features.monthly_voice_minutes,
    smsCount: features.monthly_sms,
    budget: features.monthly_recharge,
    tenureMonths: features.tenure_months,
    streamingHours: features.streaming_hours,
    hotspotDataGb: features.hotspot_data_gb,
    avgMinutesPerCall: features.avg_minutes_per_call,
    internationalMinutes: features.international_minutes,
    roamingVoiceMinutes: features.roaming_voice_minutes,
    roamingDataGb: features.roaming_data_gb,
    roamingRequired: Number(features.roaming_data_gb || 0) > 0
  };
}

function diffProfiles(baseline, simulated) {
  const keys = new Set([...Object.keys(baseline), ...Object.keys(simulated)]);
  const changes = [];

  for (const key of keys) {
    const from = baseline[key];
    const to = simulated[key];
    if (from === to) continue;
    if (from === undefined && to === undefined) continue;

    const numeric = Number.isFinite(Number(from)) && Number.isFinite(Number(to));

    changes.push({
      field: key,
      from,
      to,
      delta: numeric ? Number((Number(to) - Number(from)).toFixed(2)) : null
    });
  }

  return changes;
}

function compareRankings(baseline, simulated) {
  const baselineRank = new Map(baseline.ranked.map((entry) => [entry.planId, entry]));
  const simulatedRank = new Map(simulated.ranked.map((entry) => [entry.planId, entry]));

  const movements = simulated.ranked.map((entry) => {
    const before = baselineRank.get(entry.planId);
    return {
      planId: entry.planId,
      planName: entry.plan.planName,
      rankBefore: before ? before.rank : null,
      rankAfter: entry.rank,
      rankDelta: before ? before.rank - entry.rank : null,
      scoreBefore: before ? before.matchPercent : null,
      scoreAfter: entry.matchPercent,
      scoreDelta: before ? entry.matchPercent - before.matchPercent : null
    };
  });

  const baselineTop3 = baseline.top3.map((entry) => entry.planId);
  const simulatedTop3 = simulated.top3.map((entry) => entry.planId);

  const entered = simulated.top3.filter((entry) => !baselineTop3.includes(entry.planId));
  const left = baseline.top3.filter((entry) => !simulatedTop3.includes(entry.planId));

  const topBefore = baseline.top3[0];
  const topAfter = simulated.top3[0];

  const priceDelta = topAfter.plan.price - topBefore.plan.price;

  const narrative = [];

  if (baseline.clusterId !== simulated.clusterId) {
    narrative.push(
      `Your persona changes from "${baseline.persona}" to "${simulated.persona}" under this scenario.`
    );
  } else {
    narrative.push(`You stay in the "${simulated.persona}" persona under this scenario.`);
  }

  if (topBefore.planId === topAfter.planId) {
    const scoreShift = topAfter.matchPercent - topBefore.matchPercent;
    narrative.push(
      `${topAfter.plan.planName} remains your top match (${topBefore.matchPercent}% to ${topAfter.matchPercent}%, ${scoreShift >= 0 ? "+" : ""}${scoreShift} points).`
    );
  } else {
    narrative.push(
      `Your top match moves from ${topBefore.plan.planName} (${topBefore.matchPercent}%) to ${topAfter.plan.planName} (${topAfter.matchPercent}%).`
    );
    narrative.push(
      priceDelta === 0
        ? "Monthly price is unchanged."
        : `That is Rs ${Math.abs(priceDelta).toLocaleString("en-IN")} ${priceDelta > 0 ? "more" : "less"} per cycle.`
    );
  }

  if (entered.length > 0) {
    narrative.push(
      `New in your Top 3: ${entered.map((entry) => entry.plan.planName).join(", ")}.`
    );
  }

  if (left.length > 0) {
    narrative.push(
      `Dropped out of your Top 3: ${left.map((entry) => entry.plan.planName).join(", ")}.`
    );
  }

  return {
    movements,
    enteredTop3: entered.map((entry) => ({
      planId: entry.planId,
      planName: entry.plan.planName,
      matchPercent: entry.matchPercent
    })),
    leftTop3: left.map((entry) => ({
      planId: entry.planId,
      planName: entry.plan.planName,
      matchPercent: entry.matchPercent
    })),
    topPlanChanged: topBefore.planId !== topAfter.planId,
    personaChanged: baseline.clusterId !== simulated.clusterId,
    priceDelta,
    narrative: narrative.join(" ")
  };
}

/**
 * @param {object} options
 * @param {object} [options.baselineProfile]  explicit baseline
 * @param {string} [options.customerId]       or derive the baseline from a stored customer
 * @param {object} options.changes            fields to override on the baseline
 */
async function simulate(options = {}) {
  let baselineProfile = options.baselineProfile;

  if (!baselineProfile && options.customerId) {
    const customer = await store.findById("customers", options.customerId);
    if (!customer) {
      const error = new Error(`Customer ${options.customerId} not found.`);
      error.status = 404;
      throw error;
    }
    baselineProfile = baselineProfileFromCustomer(customer);
  }

  if (!baselineProfile) {
    const error = new Error(
      "A what-if simulation needs either baselineProfile or customerId."
    );
    error.status = 400;
    throw error;
  }

  const simulatedProfile = { ...baselineProfile, ...(options.changes || {}) };

  const [baseline, simulated] = await Promise.all([
    recommendationService.recommendForProfile(baselineProfile, {
      customerId: options.customerId ?? null,
      source: "what_if_baseline",
      persist: false
    }),
    recommendationService.recommendForProfile(simulatedProfile, {
      customerId: options.customerId ?? null,
      source: "what_if",
      persist: options.persist === true
    })
  ]);

  return {
    baselineProfile,
    simulatedProfile,
    profileChanges: diffProfiles(baselineProfile, simulatedProfile),
    baseline: {
      clusterId: baseline.clusterId,
      persona: baseline.persona,
      top3: baseline.top3,
      ranked: baseline.ranked
    },
    simulated: {
      clusterId: simulated.clusterId,
      persona: simulated.persona,
      top3: simulated.top3,
      ranked: simulated.ranked,
      personaAssignment: simulated.personaAssignment
    },
    impact: compareRankings(baseline, simulated)
  };
}

module.exports = { simulate, baselineProfileFromCustomer };
