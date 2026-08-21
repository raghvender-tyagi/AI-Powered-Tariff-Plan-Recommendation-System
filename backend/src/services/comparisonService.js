const catalog = require("./catalogService");
const rag = require("./ragService");

/**
 * Side-by-side plan comparison.
 *
 * Where a comparison needs a match score it reuses the score the
 * recommendation engine already produced for that customer (passed in by the
 * caller); it never re-scores plans on its own.
 */

const ROWS = [
  { key: "price", label: "Price", unit: "INR", better: "lower" },
  { key: "dailyDataGb", label: "Data per day", unit: "GB", better: "higher" },
  { key: "monthlyDataGb", label: "Data per month", unit: "GB", better: "higher" },
  { key: "validityDays", label: "Validity", unit: "days", better: "higher" },
  { key: "pricePerGb", label: "Price per GB", unit: "INR", better: "lower" },
  { key: "categoryLabel", label: "Category", unit: null, better: null },
  { key: "allowanceLabel", label: "Allowance type", unit: null, better: null },
  { key: "coverage", label: "Covers", unit: null, better: null },
  { key: "persona", label: "Mapped persona", unit: null, better: null },
  { key: "differentiator", label: "Differentiator", unit: null, better: null }
];

const ALLOWANCE_LABELS = {
  personal: "Personal daily data",
  shared_pool: "Shared family pool",
  business_pool: "Pooled business data"
};

function decorate(plan) {
  return {
    ...plan,
    allowanceLabel: ALLOWANCE_LABELS[plan.allowanceType] ?? plan.allowanceType,
    coverage: plan.members
      ? `${plan.members} members`
      : plan.employees
        ? `${plan.employees} employees`
        : "1 connection"
  };
}

function bestFor(plans, row) {
  if (!row.better) return null;

  const numeric = plans
    .map((plan) => ({ id: plan._id, value: Number(plan[row.key]) }))
    .filter((item) => Number.isFinite(item.value));

  if (numeric.length === 0) return null;

  const sorted = [...numeric].sort((a, b) =>
    row.better === "lower" ? a.value - b.value : b.value - a.value
  );

  // No winner if everything ties.
  if (sorted.length > 1 && sorted[0].value === sorted[sorted.length - 1].value) return null;

  return sorted[0].id;
}

function verdicts(plans, scoresByPlanId = {}) {
  const results = [];

  const withScores = plans.filter((plan) => Number.isFinite(scoresByPlanId[plan._id]));

  if (withScores.length > 1) {
    const best = [...withScores].sort(
      (a, b) => scoresByPlanId[b._id] - scoresByPlanId[a._id]
    )[0];
    results.push({
      key: "overall",
      label: "Best overall match",
      planId: best._id,
      planName: best.planName,
      basis: `Highest recommendation-engine score (${scoresByPlanId[best._id]}%)`
    });
  }

  const value = [...plans]
    .filter((plan) => Number.isFinite(plan.pricePerGb))
    .sort((a, b) => a.pricePerGb - b.pricePerGb)[0];

  if (value) {
    results.push({
      key: "value",
      label: "Best value per GB",
      planId: value._id,
      planName: value.planName,
      basis: `Rs ${value.pricePerGb} per GB of monthly allowance`
    });
  }

  const data = [...plans].sort((a, b) => b.monthlyDataGb - a.monthlyDataGb)[0];

  if (data) {
    results.push({
      key: "data",
      label: "Largest data allowance",
      planId: data._id,
      planName: data.planName,
      basis: `${data.dailyDataGb} GB/day (${data.monthlyDataGb} GB a month)`
    });
  }

  const cheapest = [...plans].sort((a, b) => a.price - b.price)[0];

  if (cheapest) {
    results.push({
      key: "price",
      label: "Lowest price",
      planId: cheapest._id,
      planName: cheapest.planName,
      basis: `Rs ${cheapest.price} per cycle`
    });
  }

  const longest = [...plans].sort((a, b) => b.validityDays - a.validityDays)[0];

  if (longest && longest.validityDays !== plans[0].validityDays) {
    results.push({
      key: "validity",
      label: "Longest validity",
      planId: longest._id,
      planName: longest.planName,
      basis: `${longest.validityDays} days`
    });
  }

  return results;
}

/**
 * @param {string[]} planIds
 * @param {object}   scoresByPlanId  optional { planId: matchPercent } from a recommendation
 */
function compare(planIds = [], scoresByPlanId = {}) {
  const all = catalog.getPlans();
  const plans = planIds
    .map((id) => all.find((plan) => plan._id === id))
    .filter(Boolean)
    .map(decorate);

  if (plans.length < 2) {
    const error = new Error("A comparison needs at least two valid plan ids.");
    error.status = 400;
    throw error;
  }

  const rows = ROWS.map((row) => ({
    key: row.key,
    label: row.label,
    unit: row.unit,
    better: row.better,
    bestPlanId: bestFor(plans, row),
    values: plans.map((plan) => ({ planId: plan._id, value: plan[row.key] ?? null }))
  }));

  return {
    plans,
    rows,
    verdicts: verdicts(plans, scoresByPlanId),
    semanticNeighbours: Object.fromEntries(
      plans.map((plan) => [plan._id, rag.relatedPlans(plan._id, 3)])
    )
  };
}

module.exports = { compare, ROWS };
