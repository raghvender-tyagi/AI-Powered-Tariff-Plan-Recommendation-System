import { http, call } from './client';

// POST /api/admin/clusters/run  (JWT required)
export const runClusteringJob = (fullPipeline = false) =>
  call(() => http.post('/admin/clusters/run', { fullPipeline }));

// GET /api/admin/clusters/run/:jobId (JWT required)
export const getClusteringJobStatus = (jobId) =>
  call(() => http.get(`/admin/clusters/run/${jobId}`));

// GET /api/admin/stats (JWT required)
export const getAdminStats = () => call(() => http.get('/admin/stats'));
