import { http, call } from './client';

// GET /api/plans — the full 25-plan catalogue from plan_catalog.json
export const getPlans = () => call(() => http.get('/plans'));

// GET /api/plans/:id — one plan plus its semantic neighbours
export const getPlan = (id) => call(() => http.get(`/plans/${id}`));

// GET /api/categories — plan categories (FLEX / PLAY / FAMILY / BUSINESS / PRIME)
export const getCategories = () => call(() => http.get('/categories'));

// GET /api/plans/search?q= — embedding / cosine-similarity plan search
export const searchPlans = (query, limit = 5) =>
  call(() => http.get('/plans/search', { params: { q: query, limit } }));

// POST /api/plans/compare — backend-built comparison table + verdicts
export const comparePlans = (planIds, scores = {}) =>
  call(() => http.post('/plans/compare', { planIds, scores }));
