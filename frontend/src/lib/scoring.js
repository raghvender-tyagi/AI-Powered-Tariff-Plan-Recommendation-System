// Client-side mirror of the backend's weighted-fit recommendation formula
// (server/src/services/recommendationEngine.js per the technical plan):
//
//   score(plan, profile) =
//       w1 * dataFit(plan.dataGB, profile.dataNeed)
//     + w2 * callFit(plan.callMinutes, profile.callNeed)
//     + w3 * budgetFit(plan.price, profile.budget)
//     + w4 * roamingMatch(plan.roamingIncluded, profile.roaming)
//     + w5 * clusterAffinity(plan.clusterIds, profile.clusterId)
//
// This mirror exists ONLY so the What-If Simulator and onboarding preview can
// react instantly in the browser. Whenever the real backend is reachable, its
// response is used as the source of truth — this is a client-side estimate,
// clearly labeled as such in the UI.

export const WEIGHTS = { data: 0.3, calling: 0.2, budget: 0.25, roaming: 0.15, persona: 0.1 };

const fitCurve = (have, need) => {
  if (need <= 0) return 1;
  const ratio = have / need;
  if (ratio >= 1) {
    // gentle penalty for very large excess (paying for unused headroom)
    const excess = ratio - 1;
    return Math.max(0.55, 1 - excess * 0.18);
  }
  // shortfall is penalized harder than excess
  return Math.max(0, ratio - (1 - ratio) * 0.35);
};

const budgetFit = (price, budget) => {
  if (!budget || budget <= 0) return 0.6;
  if (price <= budget) {
    const slack = (budget - price) / budget;
    return Math.min(1, 0.75 + slack * 0.5);
  }
  const over = (price - budget) / budget;
  return Math.max(0, 1 - over * 1.4);
};

const roamingMatch = (planHasRoaming, needsRoaming) => {
  if (!needsRoaming) return planHasRoaming ? 0.85 : 1;
  return planHasRoaming ? 1 : 0.15;
};

const clusterAffinity = (planClusterIds = [], clusterId) => {
  if (!clusterId) return 0.6;
  return planClusterIds.includes(clusterId) ? 1 : 0.45;
};

export function scorePlan(plan, profile) {
  const dataFit = fitCurve(plan.dataGB, profile.dataNeedGB);
  const callFit = fitCurve(plan.callMinutes, profile.callNeedMin);
  const bFit = budgetFit(plan.price, profile.budget);
  const rFit = roamingMatch(plan.roamingIncluded, profile.roamingRequired);
  const pFit = clusterAffinity(plan.clusterIds, profile.clusterId);

  const weighted =
    WEIGHTS.data * dataFit +
    WEIGHTS.calling * callFit +
    WEIGHTS.budget * bFit +
    WEIGHTS.roaming * rFit +
    WEIGHTS.persona * pFit;

  return {
    total: Math.round(Math.max(0, Math.min(1, weighted)) * 100),
    breakdown: {
      dataFit: Math.round(clampUnit(dataFit) * 100),
      callingFit: Math.round(clampUnit(callFit) * 100),
      budgetFit: Math.round(clampUnit(bFit) * 100),
      roamingFit: Math.round(clampUnit(rFit) * 100),
      personaFit: Math.round(clampUnit(pFit) * 100),
    },
  };
}

const clampUnit = (v) => Math.min(1, Math.max(0, v));

export function rankPlans(plans, profile, topN = 3) {
  return plans
    .map((plan) => ({ plan, ...scorePlan(plan, profile) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);
}

// Need-level ('low'|'medium'|'high') -> approximate numeric requirement,
// used by the onboarding flow before a precise number is known.
export const NEED_TO_GB = { low: 2, medium: 8, high: 25 };
export const NEED_TO_MIN = { low: 150, medium: 500, high: 1500 };
