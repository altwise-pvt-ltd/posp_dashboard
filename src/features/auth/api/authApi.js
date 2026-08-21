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
 * The user, in the shape the app uses.
 *
 * Thin on purpose. Verify's `data` describes the *application*, not the person
 * — there is no user object on the wire at all — so the only fact we hold about
 * them is the number the server has just confirmed, which is as authoritative
 * as anything it could have sent back.
 *
 * `name` and `email` are collected by the onboarding wizard rather than handed
 * out at sign-in; when a profile endpoint exists, this is the function its
 * fields get normalised in, so the components reading them never change.
 */
function toUser(mobile) {
  return { mobile: mobile ?? null };
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
 *   { token, applicationId, currentStep, expiresAt }
 *
 * and it is split into four fields here because they have four different
 * owners: the token is the credential, `user` is what the topbar renders,
 * `application` is what every later onboarding call has to quote, and
 * `expiresAt` is the server's own word on how long the rest of it is good for.
 * Returning the raw envelope instead would push that sorting into each caller.
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
     * Carried because the server sent it, not because anything gates on it —
     * a 401 is still the only expiry signal the app acts on (see the note in
     * `shared/api/client.js`). Kept so a resume can tell "the token died while
     * the tab was shut" from "the server rejected a live token", which read
     * identically without it.
     */
    expiresAt: data.expiresAt ?? null,
    user: toUser(mobile),
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
