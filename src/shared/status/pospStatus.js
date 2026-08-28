import { VERIFICATION } from '@/shared/store/verificationStore';

/**
 * The server's status vocabulary, in one place.
 *
 * Three of the five status fields are read here: `OnboardingOverallStatus` (the
 * funnel headline, on verify-otp) and the `status` / `kycStatus` pair on
 * `GET /posp/me`. `PostApprovalStatus` is deliberately absent — exam eligibility
 * is asked of `GET /exam/eligibility`, the only thing that knows it.
 *
 * ⚠ Whole-word tables, never patterns. The substring matching this replaced read
 * `Inactive` as `ACTIVE` and cleared a deactivated POSP into training, and missed
 * `EXAM_PASS_CERTIFIED` entirely because `CERTIFIED` is not `VERIFIED`. Add a
 * value to the table; do not add a regex.
 */

const normalise = (value) =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

/* ── Flow status — the one the app routes on ─────────────────────────────── */

/**
 * One flow value answers several questions at once, so the facts are spelled out
 * rather than left for each caller to re-derive from the string.
 *
 *   verification — the app's three-way verdict
 *   wizardOpen   — the application is editable
 *   terminal     — decided against, no route back
 *   approved     — a reviewer signed the KYC off
 *   enrolled     — training started, not merely offered
 *   hoursSettled — course finished; exam pending or already sat
 *   certified    — passed *and* the certificate exists
 *
 * `hoursSettled` and `certified` are separate because the flow only advances to
 * `EXAM_PASS_CERTIFIED` on a pass whose certificate was issued, and issuing can
 * fail on its own. A POSP who genuinely passed can still be sitting at
 * `TRAINING_COMPLETED_EXAMINATION`; only `/exam/eligibility` → `alreadyPassed`
 * can tell.
 */
const FLOW_FACTS = {
  /* The wizard. Which step is next comes from `GET /onboarding/status`, which
     carries per-step detail this headline does not. */
  PAN_PENDING: { wizardOpen: true },
  EMAIL_PENDING: { wizardOpen: true },
  AADHAAR_PENDING: { wizardOpen: true },
  SELFIE_PENDING: { wizardOpen: true },
  BANK_PENDING: { wizardOpen: true },
  EDUCATION_PENDING: { wizardOpen: true },
  BUSINESS_PENDING: { wizardOpen: true },
  REVIEW_PENDING: { wizardOpen: true },

  UNDER_VERIFICATION: {},

  /* The only route from review back to an editable application. */
  CORRECTION_REQUIRED: { verification: VERIFICATION.REJECTED, wizardOpen: true },

  /* ⚠ Terminal — the wizard does not reopen. Anything offering "update your
     details" against this is pointing at a locked door. */
  REJECTED: { verification: VERIFICATION.REJECTED, terminal: true },

  VERIFIED: { verification: VERIFICATION.VERIFIED, approved: true },
  VERIFIED_UNDER_TRAINING: {
    verification: VERIFICATION.VERIFIED,
    approved: true,
    enrolled: true,
  },
  TRAINING_COMPLETED_EXAMINATION: {
    verification: VERIFICATION.VERIFIED,
    approved: true,
    enrolled: true,
    hoursSettled: true,
  },
  EXAM_PASS_CERTIFIED: {
    verification: VERIFICATION.VERIFIED,
    approved: true,
    enrolled: true,
    hoursSettled: true,
    certified: true,
  },

  /* ⚠ Defined by the server and never produced — a failed exam changes no status
     at all. Mapped defensively so it lands on the honest facts if it ever starts
     arriving. Nothing may wait on it. */
  EXAM_FAILED_UNDER_TRAINING: {
    verification: VERIFICATION.VERIFIED,
    approved: true,
    enrolled: true,
    hoursSettled: true,
  },

  /* A stale application. No facts set — holding them at the waiting screen is
     the safe direction until the back office says what belongs here. */
  ABANDONED: {},
};

/**
 * The default for an unrecognised value: every fact false, verdict pending.
 * Deliberately asymmetric — unknown only ever holds a POSP back, where the
 * opposite mistake lets an unchecked profile through into training.
 */
const UNKNOWN_FLOW = {
  verification: VERIFICATION.PENDING,
  wizardOpen: false,
  terminal: false,
  approved: false,
  enrolled: false,
  hoursSettled: false,
  certified: false,
};

/** One flow value → every fact it carries. Safe to call with null. */
export function describeFlow(overallStatus) {
  return { ...UNKNOWN_FLOW, ...(FLOW_FACTS[normalise(overallStatus)] ?? null) };
}

/** Whether the server's value is one this file knows — for spotting drift, not
 *  for routing. */
export const isKnownFlow = (overallStatus) =>
  Object.hasOwn(FLOW_FACTS, normalise(overallStatus));

/* ── `GET /posp/me` → `status` ───────────────────────────────────────────── */

/**
 * `PospStatus`. Note there is no `TrainingCompleted` member — `ExamPending` is
 * that state, and one must not be added because the backend compares this enum
 * by order.
 *
 * ⚠ `Suspended` / `Inactive` / `Terminated` are exits, not stages. They map to
 * PENDING because it is the only verdict that holds a POSP back, but "under
 * review" is the wrong thing to tell them — no screen has copy for an exited
 * account yet.
 */
const POSP_STATUS_VERDICT = {
  REGISTERED: VERIFICATION.PENDING,
  KYCPENDING: VERIFICATION.PENDING,
  KYC_PENDING: VERIFICATION.PENDING,
  KYCUNDERREVIEW: VERIFICATION.PENDING,
  KYC_UNDER_REVIEW: VERIFICATION.PENDING,
  KYCAPPROVED: VERIFICATION.VERIFIED,
  KYC_APPROVED: VERIFICATION.VERIFIED,
  TRAININGINPROGRESS: VERIFICATION.VERIFIED,
  TRAINING_IN_PROGRESS: VERIFICATION.VERIFIED,
  EXAMPENDING: VERIFICATION.VERIFIED,
  EXAM_PENDING: VERIFICATION.VERIFIED,
  CERTIFIED: VERIFICATION.VERIFIED,
  ACTIVE: VERIFICATION.VERIFIED,

  SUSPENDED: VERIFICATION.PENDING,
  INACTIVE: VERIFICATION.PENDING,
  TERMINATED: VERIFICATION.PENDING,
};

/* ── `GET /posp/me` → `kycStatus` ────────────────────────────────────────── */

const KYC_STATUS_VERDICT = {
  PENDING: VERIFICATION.PENDING,
  SUBMITTED: VERIFICATION.PENDING,
  UNDERREVIEW: VERIFICATION.PENDING,
  UNDER_REVIEW: VERIFICATION.PENDING,
  APPROVED: VERIFICATION.VERIFIED,
  REJECTED: VERIFICATION.REJECTED,
  CORRECTIONREQUIRED: VERIFICATION.REJECTED,
  CORRECTION_REQUIRED: VERIFICATION.REJECTED,
};

/**
 * The three-way verdict from whichever signals are present.
 *
 * `overallStatus` wins outright when known — it is the only field spanning the
 * whole journey, where the pair stops at the KYC. Between the pair, rejection
 * wins: a record saying both is a record being sent back.
 */
export function verdictFrom({ status, kycStatus, overallStatus } = {}) {
  if (isKnownFlow(overallStatus)) return describeFlow(overallStatus).verification;

  const verdicts = [
    POSP_STATUS_VERDICT[normalise(status)],
    KYC_STATUS_VERDICT[normalise(kycStatus)],
  ].filter(Boolean);

  if (verdicts.includes(VERIFICATION.REJECTED)) return VERIFICATION.REJECTED;
  if (verdicts.includes(VERIFICATION.VERIFIED)) return VERIFICATION.VERIFIED;
  return VERIFICATION.PENDING;
}
