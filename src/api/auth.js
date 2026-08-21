import { http, callWithFallback, setAuthToken } from './client';

// POST /api/auth/login  { username, password } -> { token }
export const login = async (username, password) => {
  const result = await callWithFallback(
    () => http.post('/auth/login', { username, password }),
    () => ({ token: `demo.${btoa(username)}.token` }),
  );
  if (result.data?.token) setAuthToken(result.data.token);
  return result;
};

export const logout = () => setAuthToken(null);

// GET /api/health
export const getHealth = () =>
  callWithFallback(
    () => http.get('/health'),
    () => ({ status: 'demo' }),
  );
