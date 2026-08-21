import { http, call } from './client';

// GET /api/clusters — K-Means personas from cluster_profiles.json
export const getClusters = () => call(() => http.get('/clusters'));

// GET /api/clusters/:id — one cluster plus the plans mapped to it
export const getCluster = (id) => call(() => http.get(`/clusters/${id}`));

// GET /api/clusters/:id/customers
export const getClusterCustomers = (id, limit = 12) =>
  call(() => http.get(`/clusters/${id}/customers`, { params: { limit } }));
