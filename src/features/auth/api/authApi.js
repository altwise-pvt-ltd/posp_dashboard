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

import { getDb } from '@/shared/api/mockDb';

/**
 * Ask for a code. Resolves when the SMS is on its way; the response carries no
 * payload worth reading beyond a throttle hint.
 */
export async function requestOtp(mobile) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { message: 'OTP sent successfully' };
}

/**
 * Ask for another code. Separate from `requestOtp` because the server throttles
 * the two differently — a resend is the call that comes back 429 with a
 * `Retry-After`, which the form uses to set its cooldown.
 */
export async function resendOtp(mobile) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { message: 'OTP sent successfully' };
}

/**
 * Exchange the code for a session.
 */
export async function verifyOtp(mobile, otp) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!otp || otp.length !== 6) {
    throw new ApiError({
      message: 'Invalid OTP. Please enter a 6-digit code.',
      status: 400,
    });
  }

  const db = getDb();
  
  // Read verification status from local storage
  const verificationStatus = localStorage.getItem('profileVerification') || 'pending';
  
  let overallStatus = 'PAN_PENDING';
  let flow = 'ONBOARDING';

  if (db.isCompleted) {
    if (verificationStatus === 'verified') {
      overallStatus = 'VERIFIED_UNDER_TRAINING';
      flow = 'REGISTERED';
    } else if (verificationStatus === 'rejected') {
      overallStatus = 'KYC_REJECTED';
      flow = 'CORRECTION';
    } else {
      overallStatus = 'UNDER_VERIFICATION';
      flow = 'REGISTERED';
    }
  } else {
    // Determine overallStatus based on what steps are completed
    if (!db.pan) overallStatus = 'PAN_PENDING';
    else if (!db.email || !db.email.isVerified) overallStatus = 'EMAIL_PENDING';
    else if (!db.aadhaar) overallStatus = 'AADHAAR_PENDING';
    else if (!db.selfie) overallStatus = 'SELFIE_PENDING';
    else if (!db.bank) overallStatus = 'BANK_PENDING';
    else if (!db.education) overallStatus = 'EDUCATION_PENDING';
    else if (!db.business) overallStatus = 'BUSINESS_PENDING';
    else overallStatus = 'REVIEW_PENDING';
  }

  const token = 'mock-jwt-token';

  return {
    token,
    flow: toFlow(flow),
    overallStatus,
    expiresAt: null,
    user: toUser({
      user: {
        id: 'mock-user-id',
        fullName: db.pan?.fullName || 'John Doe',
        email: db.email?.email || 'john.doe@example.com',
        mobile,
        role: 'POSP'
      }
    }, mobile),
    application: {
      id: 'mock-app-id',
      currentStep: db.isCompleted ? 8 : (
        !db.pan ? 1 :
        (!db.email || !db.email.isVerified) ? 2 :
        !db.aadhaar ? 3 :
        !db.selfie ? 4 :
        !db.bank ? 5 :
        !db.education ? 6 :
        !db.business ? 7 : 8
      )
    }
  };
}

/**
 * Revoke the token server-side.
 */
export async function logout() {
  await new Promise((resolve) => setTimeout(resolve, 300));
}
