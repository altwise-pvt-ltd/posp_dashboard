import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { VERIFICATION } from '@/shared/store/verificationStore';

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
 * The server describes the same fact at three levels of detail, arriving from
 * two different calls:
 *
 *   overallStatus — the funnel headline, on verify-otp   e.g. `VERIFIED_UNDER_TRAINING`
 *   status        — the POSP row's lifecycle, on /posp/me e.g. `KycApproved`
 *   kycStatus     — how far the KYC itself got            e.g. `Approved`
 *
 * `overallStatus` is the one the app routes on — see `shared/auth/resumeSession.js`.
 * The other two are folded in by the same function so there is one vocabulary
 * to maintain rather than two, and so a caller holding only a profile still
 * gets an answer.
 *
 * They are reduced to the app's own three-way verdict because every screen
 * downstream already speaks `VERIFICATION.PENDING | VERIFIED | REJECTED`, and
 * nothing is gained by teaching them the server's wider vocabulary.
 *
 * ⚠ Matching is by SUBSTRING, not whole word, and `VERIFIED_UNDER_TRAINING` is
 * why. It is a compound — KYC cleared, training still outstanding — and under
 * the anchored match this used to use it hit nothing, fell through to the
 * PENDING default, and pinned a fully verified POSP to the waiting screen.
 * Only the KYC half of that value is this function's business; the training
 * half belongs to `certificationStore`.
 *
 * `UNDER_VERIFICATION` is the near-miss that shapes the pattern: it contains
 * `VERIFIC`, not `VERIFIED`, so it correctly stays PENDING. That is why CLEARED
 * lists whole words rather than a looser `VERIF` stem — a stem would read
 * "waiting to be verified" as "verified".
 *
 * The defaulting stays deliberately asymmetric: anything unrecognised reads as
 * PENDING, which only ever holds a POSP back — the safe direction to be wrong
 * in, since the alternative lets an unchecked profile through to training.
 */

/** Cleared KYC. Substring — see the note above. */
const CLEARED = /VERIFIED|APPROVED|ACTIVE|COMPLETED/;

/** Sent back. Substring too, so `KycRejected`, `REJECTED` and `KYC_REJECTED`
 *  all land the same way. Checked first, so a value carrying both wins here. */
const SENT_BACK = /REJECT/;

/**
 * Already on the programme — the *training* half of the compound.
 *
 * `VERIFIED_UNDER_TRAINING` states two things at once: the KYC is cleared, and
 * this POSP is enrolled. `deriveVerification` reads only the first half by
 * design (see the note above); this reads the second, so the funnel can tell
 * `VERIFIED` — cleared, hasn't picked a line yet — from `VERIFIED_UNDER_TRAINING`
 * — cleared and already sitting the hours. Collapsing the two is what used to
 * walk an enrolled POSP back through the approval screen and out onto "choose
 * your insurance line".
 *
 * Deliberately narrow. A looser `/TRAINING/` would also match whatever the
 * server calls the finished state (`TRAINING_COMPLETED` and the like) and read a
 * certified POSP as still mid-course — the one direction this must not be wrong
 * in, since it would hide the exam behind hours already served.
 */
const ENROLLED = /UNDER_?TRAINING/;

const normalise = (value) =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

/**
 * One verdict from whichever of the three signals is present. Rejection wins
 * over clearance — a record that says both is a record being sent back.
 *
 * Exported because the sign-in path calls it on `overallStatus` alone, with no
 * profile in hand: that value arrives on the verify-otp reply and is what the
 * funnel is set from, before `GET /posp/me` has answered or even been sent.
 */
export function deriveVerification({ status, kycStatus, overallStatus } = {}) {
  const signals = [status, kycStatus, overallStatus].map(normalise).filter(Boolean);

  if (signals.some((signal) => SENT_BACK.test(signal))) return VERIFICATION.REJECTED;
  if (signals.some((signal) => CLEARED.test(signal))) return VERIFICATION.VERIFIED;
  return VERIFICATION.PENDING;
}

/**
 * Is this POSP already enrolled on the programme?
 *
 * Kept apart from `deriveVerification` rather than folded into it because it
 * answers a different stage's question. Verification asks "has a human checked
 * them?" and has three answers; this asks "have they started?" and has two, and
 * a POSP can be enrolled only *because* they were verified — one is downstream
 * of the other, not another value of it.
 *
 * Reads `overallStatus` alone: it is the only one of the three signals that
 * carries the training half at all. `/posp/me`'s `status` and `kycStatus` stop
 * at the KYC.
 */
export function isUnderTraining(overallStatus) {
  return ENROLLED.test(normalise(overallStatus));
}

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
