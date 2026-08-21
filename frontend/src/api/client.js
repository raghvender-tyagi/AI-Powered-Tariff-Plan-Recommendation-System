import axios from 'axios';

// Base URL follows the plan's client/.env contract: VITE_API_BASE_URL.
// Falls back to a same-origin /api path if unset so the app still boots.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
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
const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('tt_admin_token') : null;
if (storedToken) setAuthToken(storedToken);

/**
 * Calls the real backend; if it's unreachable (no backend wired up yet,
 * network error, 404/5xx) falls back to demo data so the UI never breaks.
 * Every call site marks its result with `__demo: true` when the fallback
 * fired, so screens can show a "Demo data" badge per requirement #34
 * (never present fabricated data as if it were real).
 */
export async function callWithFallback(request, fallbackFactory, { minDelay = 0 } = {}) {
  const start = Date.now();
  try {
    const res = await request();
    // A same-origin SPA host (no real API deployed yet) will happily return
    // 200 + index.html for an unknown /api/* path instead of a real error.
    // Axios only auto-parses JSON when the response says so, so a non-JSON
    // 2xx here means "no backend" just as much as a network error does —
    // treat it the same way and fall through to demo data.
    const contentType = res.headers?.['content-type'] || '';
    if (typeof res.data === 'string' && !contentType.includes('application/json')) {
      throw new Error('Received a non-JSON response — no API appears to be wired up at this base URL yet.');
    }
    const elapsed = Date.now() - start;
    if (minDelay && elapsed < minDelay) await sleep(minDelay - elapsed);
    return { data: res.data, demo: false };
  } catch (err) {
    const elapsed = Date.now() - start;
    if (minDelay && elapsed < minDelay) await sleep(minDelay - elapsed);
    const fallback = typeof fallbackFactory === 'function' ? await fallbackFactory(err) : fallbackFactory;
    return { data: fallback, demo: true, error: err };
  }
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
