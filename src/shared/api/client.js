import axios from 'axios';
import { ApiError } from './ApiError';
import { getToken } from '@/shared/auth/storedSession';

/**
 * The one axios instance. Nothing else in the app imports axios directly —
 * a second instance would quietly miss the auth header and the error
 * normalisation below, and the bug it caused would surface as "auth works
 * everywhere except this one screen".
 *
 * Auth is a bearer token the client holds and attaches itself (see the request
 * interceptor). Because the credential is an explicit header rather than an
 * ambient cookie, the browser never attaches it on its own — which is what
 * makes a cross-origin API and a proxy-free dev setup workable, and why there
 * is no CSRF handling in this file: a cross-site form post carries no header,
 * so there is nothing for the double-submit dance to defend against.
 */

/**
 * Where requests go. Absolute, and required — there is no dev proxy in front of
 * the API any more, so the browser talks to the backend origin directly in
 * every environment.
 *
 * ⚠ That makes every call cross-origin, which the backend must allow: it needs
 * to send `Access-Control-Allow-Origin` for this app's origin and
 * `Access-Control-Allow-Headers: Authorization`, and to answer the preflight
 * OPTIONS that the Authorization header triggers on every request.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  // Failing here beats every request 404ing against the dev server's own origin
  // and looking like a backend problem. See `.env.example`.
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env.local and point it at the API.'
  );
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

/**
 * Attach the token, if we have one.
 *
 * Read per request rather than captured once at module load: the token changes
 * when someone signs in or out, and a value baked into the instance's defaults
 * at startup would be stale for the entire life of the page.
 *
 * An anonymous request simply goes without — the login and OTP calls are
 * unauthenticated by nature, so an absent token is normal, not an error.
 */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Unauthorized seam ─────────────────────────────────────────────────── */

/**
 * What to do when the session turns out to be dead mid-session.
 *
 * Registered by `authStore` rather than imported from it: this module would
 * otherwise import the store, which imports the auth API, which imports this
 * module — a cycle that leaves one of the three half-initialised depending on
 * which the bundler reaches first. A one-line registration avoids the whole
 * class of problem and keeps this file free of app state.
 */
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

/* ── Interceptors ──────────────────────────────────────────────────────── */

api.interceptors.response.use(
  (response) => {
    /**
     * A body that reports its own failure.
     *
     * Every reply is wrapped in `{ success, message, data, errors }`, and
     * `success: false` does not always arrive with a 4xx — a wrong OTP can come
     * back 200 with the reason in `errors`. axios rejects on status alone, so
     * without this the caller would take the rejection for a success and read
     * `data: null` as an empty result: on the sign-in path that surfaces as
     * "didn't return a session token" instead of "Invalid OTP. 4 attempt(s)
     * remaining."
     *
     * Rejecting here rather than in each caller keeps one rule — a failure is
     * an ApiError in a `catch` — true whichever way the server phrases it.
     */
    const body = response.data;
    if (body && typeof body === 'object' && body.success === false) {
      return Promise.reject(
        ApiError.fromBody(body, response.status, { headers: response.headers })
      );
    }
    return response;
  },
  (error) => {
    const apiError = ApiError.from(error);

    /**
     * A 401 means the token has expired or been revoked, so the "signed in"
     * state is now a lie — clear it and let the route guard move the user.
     *
     * This is the only expiry signal there is. Nothing checks the token's own
     * clock: a client-side expiry check would still have to handle the server
     * rejecting a token it considers dead early, so the rejection is the thing
     * worth handling and the check would be a second, weaker copy of it.
     *
     * `skipAuthHandler` opts a request out — used by logout, where a 401 just
     * means the token was already dead and a "session expired" toast on the way
     * out is noise.
     */
    if (apiError.isUnauthorized && !error.config?.skipAuthHandler) {
      unauthorizedHandler?.(apiError);
    }

    return Promise.reject(apiError);
  }
);

/* ── Helpers ───────────────────────────────────────────────────────────── */

/**
 * Pull the payload out of a response.
 *
 * Envelopes like `{ success, data }` are common enough that unwrapping in one
 * place is cheaper than every caller reaching for `.data.data`. A bare body is
 * passed through untouched, so this is safe whichever style the backend uses.
 *
 * ⚠ CONFIRM WITH BACKEND — if responses are always bare, delete this and let
 * callers destructure `{ data }` themselves.
 */
export function unwrap(response) {
  const body = response?.data;
  if (body && typeof body === 'object' && 'data' in body && !Array.isArray(body)) {
    return body.data;
  }
  return body;
}

/**
 * Uploads need their own ceiling — a 30-second timeout that is generous for a
 * JSON POST will abort a selfie on a weak connection, and the retry uploads the
 * same bytes again over the same weak connection.
 *
 * Content-Type is left unset on purpose: the browser has to add the multipart
 * boundary itself, and naming the type by hand omits it and breaks the parse.
 */
export function uploadConfig({ signal, onProgress } = {}) {
  return {
    timeout: 120_000,
    signal,
    onUploadProgress: onProgress
      ? (event) => onProgress(event.total ? Math.round((event.loaded * 100) / event.total) : null)
      : undefined,
  };
}
