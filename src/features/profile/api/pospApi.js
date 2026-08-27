import { VERIFICATION } from '@/shared/store/verificationStore';
import { getDb } from '@/shared/api/mockDb';

/**
 * The POSP record — `GET /posp/me`, as the app sees it.
 */

<<<<<<< HEAD
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
=======
>>>>>>> bdce511d89b8df44a661c25e1d59deb74fa7d54b
const CLEARED = /VERIFIED|APPROVED|ACTIVE|COMPLETED/;
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

export function deriveVerification({ status, kycStatus, overallStatus } = {}) {
  const signals = [status, kycStatus, overallStatus].map(normalise).filter(Boolean);

  if (signals.some((signal) => SENT_BACK.test(signal))) return VERIFICATION.REJECTED;
  if (signals.some((signal) => CLEARED.test(signal))) return VERIFICATION.VERIFIED;
  return VERIFICATION.PENDING;
}

<<<<<<< HEAD
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
=======
>>>>>>> bdce511d89b8df44a661c25e1d59deb74fa7d54b
export function normalizeProfile(data = {}) {
  return {
    id: data.id ?? null,
    userId: data.userId ?? null,
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

    profileImagePath: data.profileImagePath ?? null,

    rmName: data.rmName ?? null,
    rmCode: data.rmCode ?? null,
    rmMobile: data.rmMobile ?? null,
    rmEmail: data.rmEmail ?? null,

    supportName: data.supportName ?? null,
    supportMobile: data.supportMobile ?? null,
    supportEmail: data.supportEmail ?? null,

    kycStatus: data.kycStatus ?? null,
    status: data.status ?? null,

    referralCode: data.referralCode ?? null,

    verification: deriveVerification(data),
  };
}

function toApiDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

/** Ask the server about the POSP behind the token. */
export async function fetchPospProfile() {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const db = getDb();
  
  // Read verification status from localStorage
  const verificationStatus = localStorage.getItem('profileVerification') || 'pending';
  
  let status = 'KycPending';
  let kycStatus = 'Submitted';
  if (verificationStatus === 'verified') {
    status = 'KycApproved';
    kycStatus = 'Approved';
  } else if (verificationStatus === 'rejected') {
    status = 'KycRejected';
    kycStatus = 'Rejected';
  }

  const rawProfile = {
    id: 'mock-posp-id',
    userId: 'mock-user-id',
    pospCode: verificationStatus === 'verified' ? 'POSP-MOCK-12345' : null,
    
    fullName: db.pan?.fullName || 'John Doe',
    email: db.email?.email || 'john.doe@example.com',
    mobile: db.email?.email ? '9999999999' : '9999999999',
    gender: 'Male',
    dateOfBirth: db.pan?.dateOfBirth ? toApiDate(db.pan.dateOfBirth) : null,

    address1: db.business?.addressLine1 || null,
    address2: db.business?.addressLine2 || null,
    address3: null,
    pincode: db.business?.pincode || null,
    state: db.business?.state || null,
    city: db.business?.city || null,

    bankName: db.bank?.bankName || null,
    branchName: db.bank?.branchName || null,
    accountType: db.bank?.accountType || null,
    accountNumber: db.bank?.accountNumber || null,
    ifscCode: db.bank?.ifscCode || null,

    aadhaarNumber: db.aadhaar?.aadhaarNumber || null,
    pancardNumber: db.pan?.panNumber || null,

    profileImagePath: 'selfie_key',

    rmName: 'RM Rajesh Kumar',
    rmCode: 'RM1024',
    rmMobile: '9876543210',
    rmEmail: 'rajesh.kumar@letsinsurance.in',

    supportName: 'Lets Support Desk',
    supportMobile: '1800-123-4567',
    supportEmail: 'support@letsinsurance.in',

    kycStatus,
    status,
    referralCode: 'REF-DEMO',
  };

  return normalizeProfile(rawProfile);
}
