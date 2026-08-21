/**
 * Small helpers for reading the catalogue plan shape the API returns.
 * Every field here comes straight from plan_catalog.json +
 * plan_cluster_mapping.json via GET /api/plans — nothing is derived or
 * assumed in the client.
 */

export const categoryLabel = (plan) => plan?.categoryLabel ?? plan?.category ?? '—';

export const categoryColor = (plan) => plan?.categoryColor ?? '#94a3b8';

export const ALLOWANCE_LABELS = {
  personal: 'Personal daily data',
  shared_pool: 'Shared family pool',
  business_pool: 'Pooled business data',
};

export const allowanceLabel = (plan) =>
  ALLOWANCE_LABELS[plan?.allowanceType] ?? plan?.allowanceType ?? '—';

/** "2 members", "10 employees" or "1 connection" — from the catalogue only. */
export const coverageLabel = (plan) => {
  if (plan?.members) return `${plan.members} members`;
  if (plan?.employees) return `${plan.employees} employees`;
  return '1 connection';
};

export const dailyData = (plan) =>
  plan?.dailyDataGb === undefined || plan?.dailyDataGb === null ? '—' : `${plan.dailyDataGb} GB`;

export const monthlyData = (plan) =>
  plan?.monthlyDataGb === undefined || plan?.monthlyDataGb === null
    ? '—'
    : `${Math.round(plan.monthlyDataGb)} GB`;

/** Score dimensions produced by the recommendation engine (weights fixed by it). */
export const SCORE_DIMENSIONS = [
  { key: 'usageFit', label: 'Usage fit', weight: '40%', tone: 'cyan' },
  { key: 'budgetFit', label: 'Budget fit', weight: '30%', tone: 'amber' },
  { key: 'personaMatch', label: 'Persona match', weight: '30%', tone: 'rose' },
];
