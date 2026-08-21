import { http, callWithFallback } from './client';
import { demoCustomer } from './mockData';

// GET /api/customers/:id
export const getCustomer = (id) =>
  callWithFallback(
    () => http.get(`/customers/${id}`),
    () => demoCustomer,
  );

// GET /api/customers/:id/usage
export const getCustomerUsage = (id) =>
  callWithFallback(
    () => http.get(`/customers/${id}/usage`),
    () => demoCustomer.usage,
  );
