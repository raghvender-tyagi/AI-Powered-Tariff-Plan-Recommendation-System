import { http, callWithFallback, sleep } from './client';
import { demoAdminStats } from './mockData';

// POST /api/admin/clusters/run  (JWT required)
export const runClusteringJob = () =>
  callWithFallback(
    () => http.post('/admin/clusters/run'),
    () => ({ jobId: `demo_job_${Date.now()}`, status: 'queued' }),
  );

// GET /api/admin/clusters/run/:jobId (JWT required)
export const getClusteringJobStatus = (jobId) =>
  callWithFallback(
    () => http.get(`/admin/clusters/run/${jobId}`),
    async () => {
      await sleep(400);
      return { status: 'success', result: { clustersUpdated: 5, customersProcessed: 16640 } };
    },
  );

export const getAdminStats = () =>
  callWithFallback(
    () => http.get('/admin/stats'),
    () => demoAdminStats,
  );
