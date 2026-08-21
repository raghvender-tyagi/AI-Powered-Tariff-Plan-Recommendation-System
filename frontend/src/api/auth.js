import { http, call, setAuthToken } from './client';

// POST /api/auth/login  { username, password } -> { token }
export const login = async (username, password) => {
  const result = await call(() => http.post('/auth/login', { username, password }));
  if (result.data?.token) setAuthToken(result.data.token);
  return result;
};

export const logout = () => setAuthToken(null);

// GET /api/health
export const getHealth = () => call(() => http.get('/health'));

// GET /api/model — K-Means / PCA / model-comparison summary
export const getModelSummary = () => call(() => http.get('/model'));
