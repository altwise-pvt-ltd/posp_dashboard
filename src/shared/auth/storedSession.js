/**
 * The signed-in session, kept where JS can actually read it.
 *
 * This is the piece that lets the app boot without asking the server anything.
 * The session used to be an httpOnly cookie, which JS cannot see — so on every
 * page load "are we signed in?" was genuinely unknown, and answering it cost a
 * round trip to `GET /auth/session` that the whole app had to wait on. A token
 * we can read replaces that question with a synchronous lookup.
 *
 * ⚠ The tradeoff, stated plainly: a token in web storage is readable by any
 * script on the page, so an XSS bug can steal it. That is the protection an
 * httpOnly cookie gave us and this does not. What keeps it bounded is the
 * storage choice below and the fact that the token is the *only* credential —
 * nothing else sensitive is persisted here.
 *
 * `sessionStorage`, not `localStorage`: the entry is dropped when the tab
 * closes, so a stolen-device or shared-machine session does not outlive the
 * browsing session. A refresh or an in-tab navigation keeps it, which is the
 * case that actually matters for a dashboard. The cost is that a new tab starts
 * signed out — sessionStorage is per-tab and is not shared between them.
 */

/**
 * Two keys, split by who reads them. The token is looked up on every single
 * request by the axios interceptor, so it stays a bare string that needs no
 * parsing; everything else the verify call returned — the user, the
 * application, the expiry — is read once at boot and rides together in one JSON
 * blob rather than earning a key each as the backend's payload grows.
 */
const TOKEN_KEY = 'posp.token';
const SESSION_KEY = 'posp.session';

/**
 * Storage access is wrapped because it genuinely throws in the wild — Safari
 * private browsing, and any embedding where storage is partitioned or blocked.
 * A failure degrades to "not signed in", which sends the user to /login: wrong
 * but recoverable, where an uncaught throw here takes the whole app down before
 * it renders.
 */
function read(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Nothing useful to do — the app still works for this tab, it just won't
    // survive a refresh. Failing the sign-in over it would be worse.
  }
}

function remove(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore: see write().
  }
}

/**
 * Read by the axios request interceptor on every call. Deliberately a plain
 * storage read rather than a store subscription, so `shared/api/client.js` has
 * no dependency on app state (see the note on `setUnauthorizedHandler` there).
 */
export function getToken() {
  return read(TOKEN_KEY);
}

/**
 * The whole persisted session — `{ token, user, application, expiresAt }` — or
 * null. Called once at module load by `authStore` to seed its initial state.
 *
 * The details are stored next to the token rather than decoded out of it: the
 * topbar and the verification screen show the mobile number, and the onboarding
 * calls quote `application.id`, so both have to survive a refresh. Decoding the
 * JWT instead would tie the client to the server's claim names and add a
 * dependency for something a few hundred bytes of JSON already solves.
 *
 * A token with nothing readable beside it is still a valid session — the token
 * is the credential, the rest is only what we display and quote — so this
 * returns the session either way rather than discarding it. That is also the
 * state a tab left open across this change lands in, having stored the details
 * under the older key.
 */
export function readStoredSession() {
  const token = read(TOKEN_KEY);
  if (!token) return null;

  const raw = read(SESSION_KEY);
  if (!raw) return { token };

  try {
    return { token, ...JSON.parse(raw) };
  } catch {
    // Corrupt or hand-edited. Drop the unreadable half and keep the session.
    remove(SESSION_KEY);
    return { token };
  }
}

/**
 * Persist a freshly verified session. Called by `authStore.signIn()` with what
 * `verifyOtp` returned.
 *
 * The token is pulled out and the remaining fields are stored wholesale, so a
 * new one on the verify response reaches storage without a change here.
 */
export function storeSession({ token, ...details } = {}) {
  if (!token) return;
  write(TOKEN_KEY, token);

  const hasDetails = Object.values(details).some((value) => value != null);
  if (hasDetails) write(SESSION_KEY, JSON.stringify(details));
  else remove(SESSION_KEY);
}

/**
 * Forget the session. Both keys go, always — leaving the details behind would
 * put a stale name in the topbar, and a stale application id on the wizard's
 * requests, the next time someone signed in.
 */
export function clearStoredSession() {
  remove(TOKEN_KEY);
  remove(SESSION_KEY);
}
