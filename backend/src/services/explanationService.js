/**
 * Explainable recommendations.
 *
 * Every sentence produced here is derived from (a) the numbers the existing
 * recommendation engine returned for that plan and (b) the plan's own
 * catalogue fields. No scores are recomputed and no ranking is changed —
 * this module only puts the engine's arithmetic into words.
 */

const WEIGHTS = { usageFit: 0.4, budgetFit: 0.3, personaMatch: 0.3 };

const rupees = (value) => `Rs ${Math.round(Number(value)).toLocaleString("en-IN")}`;
const gb = (value) => `${Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1)} GB`;

function usageReason(plan, usage, scored) {
  const monthlyData = Number(usage.monthly_data_gb || 0);
  const allowance = Number(plan.monthlyDataGb || 0);

  if (monthlyData <= 0 || allowance <= 0) {
    return {
      key: "usage",
      label: "Data allowance",
      score: scored.usageFit,
      weight: WEIGHTS.usageFit,
      detail: `Gives ${gb(allowance)} a month (${plan.dailyDataGb} GB/day).`
    };
  }

  const headroom = allowance - monthlyData;
  const coverage = (allowance / monthlyData) * 100;

  const detail =
    headroom >= 0
      ? `Covers your ${gb(monthlyData)} monthly usage with ${gb(headroom)} to spare (${Math.round(coverage)}% coverage).`
      : `Provides ${gb(allowance)} against your ${gb(monthlyData)} usage — ${Math.round(coverage)}% of what you actually use.`;

  return {
    key: "usage",
    label: "Data allowance",
    score: scored.usageFit,
    weight: WEIGHTS.usageFit,
    detail
  };
}

function budgetReason(plan, usage, scored) {
  const budget = Number(usage.monthly_recharge || 0);
  const price = Number(plan.price);

  if (budget <= 0) {
    return {
      key: "budget",
      label: "Price",
      score: scored.budgetFit,
      weight: WEIGHTS.budgetFit,
      detail: `Costs ${rupees(price)} for ${plan.validityDays} days. No budget on file, so a neutral budget score was applied.`
    };
  }

  const diff = budget - price;

  const detail =
    diff >= 0
      ? `At ${rupees(price)} it sits ${rupees(diff)} under your ${rupees(budget)} monthly spend.`
      : `At ${rupees(price)} it runs ${rupees(Math.abs(diff))} over your ${rupees(budget)} monthly spend.`;

  return {
    key: "budget",
    label: "Price",
    score: scored.budgetFit,
    weight: WEIGHTS.budgetFit,
    detail
  };
}

function personaReason(plan, cluster, scored) {
  const detail =
    scored.personaMatch >= 90
      ? `Mapped to the "${plan.persona}" segment, which is the segment K-Means placed you in (${cluster.customerCount.toLocaleString("en-IN")} similar customers).`
      : `Mapped to the "${plan.persona}" segment while your K-Means segment is "${cluster.personaName}", so it scores lower on persona fit.`;

  return {
    key: "persona",
    label: "Persona fit",
    score: scored.personaMatch,
    weight: WEIGHTS.personaMatch,
    detail
  };
}

/**
 * @param {object} plan     normalised catalogue plan
 * @param {object} scored   the engine's own row: { score, usageFit, budgetFit, personaMatch }
 * @param {object} usage    engine input record (monthly_data_gb, monthly_recharge, ...)
 * @param {object} cluster  the customer's cluster/persona document
 */
function explain(plan, scored, usage, cluster) {
  const reasons = [
    usageReason(plan, usage, scored),
    budgetReason(plan, usage, scored),
    personaReason(plan, cluster, scored)
  ];

  const contributions = reasons
    .map((reason) => ({
      key: reason.key,
      label: reason.label,
      score: reason.score,
      weight: reason.weight,
      contribution: Number((reason.score * reason.weight).toFixed(2))
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const strongest = contributions[0];
  const weakest = contributions[contributions.length - 1];

  const headline =
    `${plan.planName} scores ${scored.score}/100 overall. ` +
    `${reasons.find((r) => r.key === strongest.key).detail} ` +
    `${reasons.find((r) => r.key === weakest.key).detail}` +
    (plan.differentiator ? ` It also includes: ${plan.differentiator}.` : "");

  return {
    summary: headline,
    reasons,
    contributions,
    formula:
      "score = 0.40 x usageFit + 0.30 x budgetFit + 0.30 x personaMatch (weights defined by the recommendation engine)",
    strongestFactor: strongest.key,
    weakestFactor: weakest.key
  };
}

module.exports = { explain, WEIGHTS };
