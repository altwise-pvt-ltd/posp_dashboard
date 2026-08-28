import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { describeFlow, verdictFrom } from '@/shared/status/pospStatus';

/**
 * The POSP record — `GET /posp/me`, as the app sees it.
 *
 * This is the registered half of the resume mechanism. `fetchOnboardingStatus`
 * answers "how far through the form are they?"; this answers "what has the back
 * office done with the form they already sent?". Which of the two gets called is
 * decided once, by `flow` on the verify-otp reply — see `shared/auth/resumeSession.js`.
 *
 * Everything is normalised here rather than in the store or a card, so the wire
 * format stays in one file and a renamed field is a one-line change.
 */

/* ── Verdict derivation ────────────────────────────────────────────────────
 *
 * The vocabulary lives in `shared/status/pospStatus.js`. These are the two
 * readings of it the profile feature needs, kept here so callers holding a
 * profile don't have to know which status field they're looking at.
 */

/** One verdict from `overallStatus`, or from `/posp/me`'s status pair. Called by
 *  the sign-in path on `overallStatus` alone, before any profile is in hand. */
export const deriveVerification = verdictFrom;

/** Enrolled on the programme — true from `VERIFIED_UNDER_TRAINING` onward,
 *  hours-served and certified included. */
export const isUnderTraining = (overallStatus) => describeFlow(overallStatus).enrolled;

/**
 * Wire shape → app shape. Exported for tests; `fetchPospProfile` is what the
 * app calls.
 *
 * The flat fields are carried through under their own names — they are already
 * camelCase and already mean what they say, so renaming them here would only
 * add a layer to read through. What this adds is the defaulting (every field
 * answers, so a card never has to guard) and `verification`, which is the one
 * fact the funnel routes on.
 */
export function normalizeProfile(data = {}) {
  return {
    id: data.id ?? null,
    userId: data.userId ?? null,
    /** Null until the back office issues one — i.e. until they're cleared. */
    pospCode: data.pospCode ?? null,

    fullName: data.fullName ?? null,
    email: data.email ?? null,
    mobile: data.mobile ?? null,
    gender: data.gender ?? null,
    dateOfBirth: data.dateOfBirth ?? null,

    address1: data.address1 ?? null,
    address2: data.address2 ?? null,
    address3: data.address3 ?? null,
    pincode: data.pincode ?? null,
    state: data.state ?? null,
    city: data.city ?? null,

    bankName: data.bankName ?? null,
    branchName: data.branchName ?? null,
    accountType: data.accountType ?? null,
    accountNumber: data.accountNumber ?? null,
    ifscCode: data.ifscCode ?? null,

    aadhaarNumber: data.aadhaarNumber ?? null,
    pancardNumber: data.pancardNumber ?? null,

    /**
     * A document *key*, not a URL — the same shape the review screen's
     * thumbnails deal with, so it has to go through
     * `ENDPOINTS.onboarding.getDocument` and be fetched as a blob. It cannot be
     * dropped into an `<img src>`: that request carries no Authorization header.
     */
    profileImagePath: data.profileImagePath ?? null,

    rmName: data.rmName ?? null,
    rmCode: data.rmCode ?? null,
    rmMobile: data.rmMobile ?? null,
    rmEmail: data.rmEmail ?? null,

    supportName: data.supportName ?? null,
    supportMobile: data.supportMobile ?? null,
    supportEmail: data.supportEmail ?? null,

    /** Raw, as sent — kept so a bug report can show what the verdict was read
     *  from, and so a card can display the server's own wording. */
    kycStatus: data.kycStatus ?? null,
    status: data.status ?? null,

    referralCode: data.referralCode ?? null,

    /**
     * The same three-way verdict, read from this record's own two fields.
     *
     * ⚠ Not what the funnel routes on — that comes from `overallStatus` on the
     * verify-otp reply and is applied in `resumeSession`. This is here so a
     * profile screen can show the KYC state it is already rendering the rest
     * of, and as the second opinion worth logging if the two ever disagree.
     */
    verification: deriveVerification(data),
  };
}

/** Ask the server about the POSP behind the token. Requires the bearer token. */
export async function fetchPospProfile() {
  const response = await api.get(ENDPOINTS.posp.me);
  return normalizeProfile(unwrap(response) ?? {});
}
