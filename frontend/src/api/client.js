import axios from 'axios';

// Base URL follows the client/.env contract: VITE_API_BASE_URL.
// Falls back to a same-origin /api path if unset so the app still boots.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

let authToken = null;
export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    sessionStorage.setItem('tt_admin_token', token);
  } else {
    delete http.defaults.headers.common.Authorization;
    sessionStorage.removeItem('tt_admin_token');
  }
};
export const getAuthToken = () => authToken;

const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('tt_admin_token') : null;
if (storedToken) setAuthToken(storedToken);

/**
 * Every screen talks to the real Express API. There is deliberately no
 * demo/mock fallback: the recommendation engine, the 25-plan catalogue and
 * the K-Means personas are the only sources of truth, so a failed request
 * surfaces as an error state rather than as invented data.
 *
 * Returned shape stays `{ data, demo }` so call sites are unchanged; `demo`
 * is always false and exists only for backwards compatibility.
 */
export async function call(request) {
  try {
    const res = await request();

    const contentType = res.headers?.['content-type'] || '';
    if (typeof res.data === 'string' && !contentType.includes('application/json')) {
      throw new Error(
        `Expected JSON from ${API_BASE_URL} but received HTML — is the backend running on this base URL?`,
      );
    }

    return { data: res.data, demo: false };
  } catch (err) {
    throw normaliseError(err);
  }
}

function normaliseError(err) {
  const apiMessage = err?.response?.data?.error;
  const status = err?.response?.status;

  if (apiMessage) {
    const error = new Error(apiMessage);
    error.status = status;
    return error;
  }

  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') {
    const error = new Error(
      `Cannot reach the API at ${API_BASE_URL}. Start the backend with: npm --prefix backend start`,
    );
    error.status = 0;
    return error;
  }

  return err instanceof Error ? err : new Error(String(err));
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
