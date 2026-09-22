import axios from 'axios';
import { ApiError } from './ApiError';

/**
 * The second axios instance in the app, and the only justified one.
 *
 * `client.js` says nothing else should import axios directly, and that rule
 * holds for everything speaking to the POSP backend: a second instance there
 * would quietly miss the bearer token and the 401-renewal dance. This is a
 * different service on a different origin with a different credential — an
 * `x-api-key` header, no bearer, no session to renew — so routing it through
 * `api` would send the POSP's access token to a host that has no business
 * holding it, and send it to the wrong base URL besides.
 *
 * What it deliberately keeps from `client.js` is `ApiError`: callers on both
 * clients catch the same shape, so a screen doesn't have to know which service
 * it was talking to in order to show what went wrong.
 *
 * ⚠ SECURITY — `VITE_NOTIFICATION_API_KEY` is inlined into the JS bundle at
 * build time. It is not a secret: anyone can read it out of devtools or the
 * deployed asset. That is acceptable only while this key is read-only content
 * access. The moment it can publish — `/api/events/publish` is on this same
 * host — it has to move behind our own backend and this header goes away.
 */

const BASE_URL = import.meta.env.VITE_NOTIFICATION_BASE_URL;
const API_KEY = import.meta.env.VITE_NOTIFICATION_API_KEY;

/**
 * Neither variable throws, and that is a deliberate departure from `client.js`.
 *
 * That module throws because a POSP backend with no base URL is an app that
 * cannot do anything at all — failing at boot is the clearest possible signal.
 * This one is reached only from the Marketing Kit's lazy chunk, so a throw at
 * module scope takes down that one route with a blank screen and no error
 * boundary to catch it. A misconfigured content service should cost the agent
 * that screen's error state, not the screen.
 *
 * So both are warnings, and the calls fail on their own: an unset base URL
 * resolves against the app's own origin and 404s, an unset key gets a 401 or
 * 403. Either way `MarketingKitPage` shows "couldn't load" with a retry, and
 * the console says why.
 */
if (!BASE_URL) {
  console.warn(
    '[notificationClient] VITE_NOTIFICATION_BASE_URL is not set — the Marketing Kit will not load. Copy .env.example to .env.local.'
  );
}

if (!API_KEY) {
  console.warn(
    '[notificationClient] VITE_NOTIFICATION_API_KEY is not set — every call to the notification service will be rejected.'
  );
}

export const notificationApi = axios.create({
  baseURL: BASE_URL || '/',
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
  },
});

/**
 * Failures come back as `ApiError`, the same as on the POSP client.
 *
 * There is no request interceptor and no 401 handling on purpose. A 401 here
 * means the API key is wrong or revoked — a build-time misconfiguration, not an
 * expired session — and signing the POSP out because a content service rejected
 * a key would be the wrong response to the wrong problem entirely.
 */
notificationApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(ApiError.from(error))
);
