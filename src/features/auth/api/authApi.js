import { api, unwrap } from '@/shared/api/client';
import { ApiError } from '@/shared/api/ApiError';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * The auth calls, as the rest of the app sees them.
 *
 * Each one takes plain arguments and returns plain data — no axios objects
 * cross this boundary in either direction, so a component never has to know
 * how a request is made, and swapping the transport stays a change to one file.
 * Failures arrive as `ApiError` (see `shared/api/client.js`).
 */

/**
 * The three worlds a verified mobile can be in — the field the whole sign-in
 * path branches on.
 *
 *   ONBOARDING — the application is still being filled in. `GET /onboarding/status`
 *                is the only thing that knows where they got to.
 *   CORRECTION — a reviewer sent the application back and reopened it. Same call
 *                as ONBOARDING — it is the wizard again — but arrived at from
 *                the other end, so the local flags have to be reopened too: this
 *                POSP's browser remembers a *finished* application.
 *   REGISTERED — a POSP record exists and the wizard is behind them. `GET /posp/me`
 *                is what describes them now; the onboarding status has nothing
 *                left to say.
 *
 * Branching on this rather than probing both endpoints matters because the two
 * answers aren't interchangeable: a registered POSP still has an application
 * row behind them, so `/onboarding/status` would answer — with a step position
 * for a form that was submitted, which is how someone who finished ends up
 * looking at step 9 of a wizard.
 */
export const AUTH_FLOW = {
  ONBOARDING: 'ONBOARDING',
  CORRECTION: 'CORRECTION',
  REGISTERED: 'REGISTERED',
};

/**
 * `flow`, or null if the server didn't send one.
 *
 * Upper-cased rather than compared as-is: the value is an enum name on the
 * wire and a casing change would silently route every registered POSP back
 * through the wizard. Null is left null on purpose — see `resumeSession`, which
 * treats "no flow" as "ask the onboarding status", the behaviour that predates
 * this field.
 */
function toFlow(value) {
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : null;
}

/**
 * The user, in the shape the app uses.
 *
 * The verify reply now carries a real `user` object — id, name, email, mobile
 * and role — where it used to describe only the application. That makes this
 * the first point the app knows who it is talking to, so the topbar and the
 * verification screen no longer have to wait for a profile call to put a name
 * on screen.
 *
 * `mobile` falls back to the number that was just verified: it is the one field
 * we know independently of the reply, and it is what the OTP screen and the
 * topbar show.
 */
function toUser(data = {}, mobile) {
  const user = data.user ?? {};
  return {
    id: user.id ?? null,
    fullName: user.fullName ?? null,
    email: user.email ?? null,
    mobile: user.mobile ?? mobile ?? null,
    /** `POSP` today. Carried rather than assumed — an ops or admin login
     *  arriving on the same endpoint would differ here and nowhere else. */
    role: user.role ?? null,
  };
}

/**
 * Ask for a code. Resolves when the SMS is on its way; the response carries no
 * payload worth reading beyond a throttle hint.
 */
export async function requestOtp(mobile) {
  const response = await api.post(ENDPOINTS.auth.requestOtp, { mobile });
  return unwrap(response) ?? null;
}

/**
 * Ask for another code. Separate from `requestOtp` because the server throttles
 * the two differently — a resend is the call that comes back 429 with a
 * `Retry-After`, which the form uses to set its cooldown.
 */
export async function resendOtp(mobile) {
  const response = await api.post(ENDPOINTS.auth.resendOtp, { mobile });
  return unwrap(response) ?? null;
}

/**
 * Exchange the code for a session.
 *
 * The reply's `data` is:
 *
 *   { flow, token, applicationId, currentStep, expiresAt, refreshToken,
 *     user: { id, fullName, email, mobile, role }, overallStatus }
 *
 * and it is split up here because those fields have different owners: the token
 * is the credential, `user` is what the topbar renders, `application` is what
 * every later onboarding call has to quote, `expiresAt` is the server's own word
 * on how long the rest of it is good for, and `flow` decides which endpoint the
 * sign-in path asks next. Returning the raw envelope instead would push that
 * sorting into each caller.
 *
 * `refreshToken` is deliberately *not* carried. Nothing in the app renews a
 * session — a 401 signs the user out and they log in again (see the note in
 * `shared/api/client.js`) — so keeping it would mean persisting a second,
 * longer-lived credential in web storage that no code path can spend. When
 * refresh is built, this is where it starts being read.
 *
 * `applicationId` in particular is the one field that cannot be recovered if it
 * is dropped — nothing else in the app knows which application the wizard is
 * filling in — which is why it is carried and persisted from the moment it
 * arrives, well before the onboarding endpoints that need it are wired.
 *
 * The token is the credential every later request carries, so a response
 * without one is a failed sign-in however healthy its status code looked —
 * accepting it would leave the app "signed in" with nothing to authenticate
 * with, and the user would see a dashboard that 401s on contact. Better to fail
 * here, where the error lands on the OTP form the user is still looking at.
 */
export async function verifyOtp(mobile, otp) {
  const response = await api.post(ENDPOINTS.auth.verifyOtp, { mobile, otp });
  const data = unwrap(response) ?? {};
  const token = data.token ?? null;

  if (!token) {
    throw new ApiError({
      message: "Sign-in didn't return a session token. Please try again.",
      status: response?.status ?? 0,
    });
  }

  return {
    token,

    /**
     * Which resume path the session takes. See `AUTH_FLOW` above and
     * `shared/auth/resumeSession.js`, which is the only thing that reads it.
     */
    flow: toFlow(data.flow),

    /**
     * The server's headline on the application — `UNDER_VERIFICATION` for a
     * POSP waiting on the back office.
     *
     * A fallback, not the source: `GET /posp/me` carries the same fact with
     * more detail, and is what the verdict is normally read from. This is what
     * stands in when that call fails, so a POSP whose profile request 500s
     * still lands on the waiting screen rather than in the wizard.
     */
    overallStatus: data.overallStatus ?? null,

    /**
     * Carried because the server sent it, not because anything gates on it —
     * a 401 is still the only expiry signal the app acts on (see the note in
     * `shared/api/client.js`). Kept so a resume can tell "the token died while
     * the tab was shut" from "the server rejected a live token", which read
     * identically without it.
     */
    expiresAt: data.expiresAt ?? null,
    user: toUser(data, mobile),
    application: {
      id: data.applicationId ?? null,
      /**
       * How far the server thought this application had got, at the instant the
       * token was issued. 1-based, like `GET /onboarding/status`.
       *
       * Nothing routes on it, and nothing should: the resume position comes
       * from the status endpoint, which the login page calls immediately after
       * this one and which answers the same question with the per-step detail
       * the wizard actually needs. Two sources for one fact is how they drift,
       * so this stays a snapshot — useful in a bug report for telling "the
       * session was already stale" from "the status call moved them".
       */
      currentStep: data.currentStep ?? null,
    },
  };
}

/**
 * Revoke the token server-side.
 *
 * Worth the call even though the client can drop the token by itself: until the
 * server hears about it, a copy taken off the wire or out of storage stays
 * usable for the rest of its lifetime.
 */
export async function logout() {
  await api.post(ENDPOINTS.auth.logout, null, { skipAuthHandler: true });
}
