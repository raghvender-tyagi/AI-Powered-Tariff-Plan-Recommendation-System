import { http, call } from './client';

/**
 * All ranking happens in the backend recommendation engine
 * (clustering_model/src/services/recommendationEngine.js). Nothing in the
 * client scores or re-orders plans.
 */

// POST /api/recommendations/by-customer/:id — existing customer, batch K-Means label
export const getRecommendationsByCustomer = (id) =>
  call(() => http.post(`/recommendations/by-customer/${id}`));

// POST /api/recommendations/by-profile — new user, persona assigned on the fly
export const getRecommendationsByProfile = (profile, customerId = null, source = 'profile') =>
  call(() => http.post('/recommendations/by-profile', { profile, customerId, source }));

// POST /api/recommendations/what-if — baseline vs simulated, both scored by the engine
export const getWhatIf = ({ baselineProfile, customerId, changes }) =>
  call(() => http.post('/recommendations/what-if', { baselineProfile, customerId, changes }));

// GET /api/customers/:id/recommendations
export const getRecommendationHistory = (customerId) =>
  call(() => http.get(`/customers/${customerId}/recommendations`));
