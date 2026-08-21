import { http, call } from './client';

// GET /api/customers/:id
export const getCustomer = (id) => call(() => http.get(`/customers/${id}`));

// GET /api/customers/:id/usage
export const getCustomerUsage = (id) => call(() => http.get(`/customers/${id}/usage`));

// GET /api/customers?limit=
export const listCustomers = (limit = 25) =>
  call(() => http.get('/customers', { params: { limit } }));

// POST /api/customers — creates a customer from an onboarding profile and
// assigns a persona with the persisted K-Means model.
export const createCustomer = (profile, name) =>
  call(() => http.post('/customers', { profile, name }));

// PUT /api/customers/:id/current-plan
export const setCurrentPlan = (id, planId) =>
  call(() => http.put(`/customers/${id}/current-plan`, { planId }));
