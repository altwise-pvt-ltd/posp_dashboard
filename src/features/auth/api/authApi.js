import { api, unwrap } from "@/shared/api/client";
import { ApiError } from "@/shared/api/ApiError";
import { ENDPOINTS } from "@/shared/api/endpoints";

/**
 * The auth calls. Plain arguments in, plain data out — no axios objects cross
 * this boundary. Failures arrive as `ApiError` (see `shared/api/client.js`).
 */

/**
 * Which resume path a verified mobile takes. Read only by `shared/auth/resumeSession.js`.
 *
 *   ONBOARDING — application still being filled in; ask `GET /onboarding/status`
 *   CORRECTION — sent back and reopened; same call, but the local flags describe
 *                a finished application and have to be undone first
 *   REGISTERED — a POSP record exists; `GET /posp/me` describes them now
 */
export const AUTH_FLOW = {
  ONBOARDING: "ONBOARDING",
  CORRECTION: "CORRECTION",
  REGISTERED: "REGISTERED",
};

/** `flow` upper-cased, or null if the server didn't send one. `resumeSession`
 *  treats null as ONBOARDING. */
function toFlow(value) {
  return typeof value === "string" && value.trim()
    ? value.trim().toUpperCase()
    : null;
}

/** The user off the verify reply. `mobile` falls back to the number just
 *  verified. `role` is `POSP` today. */
function toUser(data = {}, mobile) {
  const user = data.user ?? {};
  return {
    id: user.id ?? null,
    fullName: user.fullName ?? null,
    email: user.email ?? null,
    mobile: user.mobile ?? mobile ?? null,
    role: user.role ?? null,
  };
}

/** Ask for a code. */
export async function requestOtp(mobile) {
  const response = await api.post(ENDPOINTS.auth.requestOtp, { mobile });
  return unwrap(response) ?? null;
}

/** Ask for another code. Throttled separately from `requestOtp` — this is the
 *  call that comes back 429 with a `Retry-After` the form reads as a cool-down. */
export async function resendOtp(mobile) {
  const response = await api.post(ENDPOINTS.auth.resendOtp, { mobile });
  return unwrap(response) ?? null;
}

/**
 * Exchange the code for a session. The reply's `data` is:
 *
 *   { flow, token, applicationId, currentStep, expiresAt, refreshToken,
 *     user: { id, fullName, email, mobile, role }, overallStatus }
 *
 * split up here by owner. `refreshToken` is deliberately not carried — nothing
 * renews a session, a 401 signs the user out.
 *
 * ⚠ Throws when the reply carries no token, however healthy its status code:
 * a session with no credential 401s on first contact.
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
    flow: toFlow(data.flow),

    /** The server's headline on the application — e.g. `UNDER_VERIFICATION`.
     *  Decoded by `shared/status/pospStatus.js`. */
    overallStatus: data.overallStatus ?? null,

    /** Carried, but nothing gates on it — a 401 is the only expiry signal the
     *  app acts on. */
    expiresAt: data.expiresAt ?? null,

    user: toUser(data, mobile),
    application: {
      /** ⚠ Unrecoverable if dropped — nothing else knows which application the
       *  wizard is filling in. */
      id: data.applicationId ?? null,

      /** A snapshot, 1-based. Nothing routes on it: the resume position comes
       *  from `GET /onboarding/status`. */
      currentStep: data.currentStep ?? null,
    },
  };
}

/** Revoke the token server-side. Until the server hears, a copy taken off the
 *  wire stays usable for the rest of its lifetime. */
export async function logout() {
  await api.post(ENDPOINTS.auth.logout, null, { skipAuthHandler: true });
}
