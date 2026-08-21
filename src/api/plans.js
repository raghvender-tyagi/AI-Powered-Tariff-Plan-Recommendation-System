import { http, callWithFallback } from './client';
import { demoPlans, demoOperators } from './mockData';

// GET /api/plans
export const getPlans = () =>
  callWithFallback(
    () => http.get('/plans'),
    () => demoPlans,
  );

export const getOperators = () =>
  callWithFallback(
    () => http.get('/operators'),
    () => demoOperators,
  );
