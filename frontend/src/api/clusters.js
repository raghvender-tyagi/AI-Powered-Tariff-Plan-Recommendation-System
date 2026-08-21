import { http, callWithFallback } from './client';
import { demoClusters, demoCustomer } from './mockData';

// GET /api/clusters
export const getClusters = () =>
  callWithFallback(
    () => http.get('/clusters'),
    () => demoClusters,
  );

// GET /api/clusters/:id/customers
export const getClusterCustomers = (id) =>
  callWithFallback(
    () => http.get(`/clusters/${id}/customers`),
    () => Array.from({ length: 8 }, (_, i) => ({ ...demoCustomer, _id: `demo_${id}_${i}`, name: `Customer ${i + 1}` })),
  );
