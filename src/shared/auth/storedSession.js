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
 * The renewal credential, in its own key for the same reason the access token
 * has one: the 401 retry path in `shared/api/client.js` asks for it before it
 * can decide whether a dead request is worth retrying, and that is no place to
 * be parsing a JSON blob.
 *
 * Same sessionStorage, same exposure as the token above — it buys a longer
 * session, not a safer one. What bounds it is that it dies with the tab, and
 * that the server hands back a new pair on every use, so the copy sitting here
 * after a renewal is not the copy that was here before it.
 */
const REFRESH_KEY = 'posp.refreshToken';

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
 * The refresh token, or null when this session was issued without one (an older
 * tab, or a server that stopped sending them). Null is a normal answer, not a
 * broken session: the caller simply treats the 401 as final and signs out,
 * which is exactly what the app did before renewal existed.
 */
export function getRefreshToken() {
  return read(REFRESH_KEY);
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
export function storeSession({ token, refreshToken, ...details } = {}) {
  if (!token) return;
  write(TOKEN_KEY, token);

  /* Pulled out of `details` rather than left to ride in the JSON blob, so the
   * 401 path can read it with one `getItem`. Absent means absent: a sign-in
   * that returns no refresh token must not leave the previous one behind, or
   * the next 401 renews a session that this one replaced. */
  if (refreshToken) write(REFRESH_KEY, refreshToken);
  else remove(REFRESH_KEY);

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
  remove(REFRESH_KEY);
}

/**
 * Swap in the pair a renewal returned, leaving the user, the application and
 * the flow exactly as they were.
 *
 * Distinct from `storeSession` on purpose: a renewal is the *same* session with
 * fresh credentials, and routing it through the sign-in path would rewrite the
 * details blob from a reply that does not carry those fields — emptying the
 * topbar's name and, worse, the application id the wizard quotes.
 *
 * A renewal that returns no new refresh token keeps the current one, which is
 * the right reading for a server that rotates only the access half.
 */
export function updateStoredTokens({ token, refreshToken, expiresAt } = {}) {
  if (!token) return;
  write(TOKEN_KEY, token);
  if (refreshToken) write(REFRESH_KEY, refreshToken);

  if (expiresAt == null) return;
  const raw = read(SESSION_KEY);
  let details;
  try {
    details = raw ? JSON.parse(raw) : {};
  } catch {
    // Corrupt, as in readStoredSession — rebuilt from the expiry alone rather
    // than dropped, since the alternative is a session with no known expiry.
    details = {};
  }
  write(SESSION_KEY, JSON.stringify({ ...details, expiresAt }));
}

/* ── Which POSP this browser last belonged to ─────────────────────── */

/**
 * The one key in this file that is NOT sessionStorage, and deliberately so:
 * its whole job is to outlive the session it exists to detect a change *from*.
 *
 * The funnel flags — `onboardingComplete`, `profileVerification`,
 * `profileVerificationSeen`, `trainingCertified`, `trainingPlan` — live in
 * localStorage and survive a sign-out by design, so on a shared machine they
 * are still sitting there when the next person signs in. Not one of them
 * carries a user id, so without this the second POSP silently inherits the
 * first one’s funnel position.
 *
 * Comparing against the stored *session* instead would not work: sign-out has
 * already run `clearStoredSession` and taken the previous id with it, and that
 * is precisely the case this has to survive.
 *
 * Only the opaque id is kept. It was inside the JWT this browser was holding a
 * moment ago, so it discloses nothing the token did not.
 */
const LAST_USER_KEY = 'posp.lastUser';

function readLocal(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Whether this sign-in belongs to someone other than the last one.
 *
 * False whenever either side is unknown — a first-ever sign-in, blocked
 * storage, a reply with no `user.id`. The caller wipes the funnel on a true,
 * so "cannot tell" has to mean "leave it alone": throwing a legitimate POSP
 * back to step 1 of a wizard they already finished is a worse outcome than the
 * stale flags this guards against, every one of which `resumeSession` already
 * corrects from the verify reply.
 */
export function isDifferentUser(userId) {
  const last = readLocal(LAST_USER_KEY);
  return Boolean(last && userId && last !== userId);
}

/** Record who this browser now belongs to. A null id is deliberately not
 *  written: it would erase a real one and leave the *next* sign-in unable to
 *  spot a change. */
export function rememberUser(userId) {
  if (!userId) return;
  try {
    window.localStorage.setItem(LAST_USER_KEY, userId);
  } catch {
    // Ignore — the guard degrades to "cannot tell", its safe default.
  }
}

/** For `Denied()`, whose whole job is to make this browser look untouched. */
export function forgetUser() {
  try {
    window.localStorage.removeItem(LAST_USER_KEY);
  } catch {
    // Ignore: see rememberUser().
  }
}
