import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { SECTIONS } from '../data/sections';

/**
 * Which local syllabus sections an option covers, matched on its name rather
 * than its id — the ids are the LMS's own and say nothing about content, while
 * "Both" / "Life Insurance" / "General Insurance" do. A name that matches
 * nothing falls back to every section, which over-serves rather than silently
 * hiding material a POSP paid hours for.
 */
const sectionIdsFor = (name = '') => {
  const text = name.toLowerCase();
  if (text.includes('both')) return SECTIONS.map((s) => s.id);

  const matched = SECTIONS.filter((s) => text.includes(s.id));
  return matched.length ? matched.map((s) => s.id) : SECTIONS.map((s) => s.id);
};

const normalizeInsuranceType = (entry = {}) => ({
  id: entry.id ?? null,
  name: entry.name ?? '',
  requiredHours: Number(entry.requiredHours) || 0,
  /** App-side: the syllabus and exam sections this option opens. */
  sectionIds: sectionIdsFor(entry.name),
});

/**
 * The lines a POSP can train in — `GET /lms/insurance-types`.
 *
 * Rejects on failure: the choice gates the whole programme, so an empty list
 * shown as "no options" would read as a decision rather than a broken call.
 */
export async function fetchInsuranceTypes() {
  const response = await api.get(ENDPOINTS.lms.insuranceTypes);
  const data = unwrap(response);

  return Array.isArray(data) ? data.map(normalizeInsuranceType) : [];
}

/**
 * Commit the choice — `POST /lms/select-insurance-type`.
 *
 * Only the id goes up; the name and the hours are the server's own and it
 * already knows them. Rejects on failure, because the caller's job is to stay
 * on the choice screen rather than start a clock the server isn't counting.
 */
export async function selectInsuranceType(insuranceTypeId) {
  const response = await api.post(ENDPOINTS.lms.selectInsuranceType, {
    insuranceTypeId,
  });
  return unwrap(response);
}

/**
 * Record acceptance of the programme terms — `POST /lms/accept-terms`.
 *
 * No body: the token says who, and the selected line says which training the
 * acceptance is stamped against. Safe to send again — the server answers a
 * repeat with the same training record rather than an error, which is what lets
 * a failed start be retried without unticking anything.
 */
export async function acceptTerms() {
  const response = await api.post(ENDPOINTS.lms.acceptTerms);
  return unwrap(response);
}

/**
 * Record acceptance of the training norms — `POST /lms/accept-training-norms`.
 *
 * The second of the two consents. Kept apart from `acceptTerms` because they
 * are two documents the POSP agrees to and the server stamps each one.
 */
export async function acceptTrainingNorms() {
  const response = await api.post(ENDPOINTS.lms.acceptTrainingNorms);
  return unwrap(response);
}

/**
 * Open the programme — `POST /lms/start-training`. The mandated hours run from
 * this call, not from the selection above it.
 *
 * Deliberately a separate press of a separate button: choosing a line is a
 * decision, starting the clock is a commitment, and a POSP who picked "Both" at
 * midnight should be able to read what the 30 hours involve before any of them
 * begin running.
 *
 * No body — the bearer token says who, and `select-insurance-type` has already
 * said which line. Sending the id again would be a second copy of a fact the
 * server is holding, able to disagree with the one it trusts.
 */
export async function startTraining() {
  const response = await api.post(ENDPOINTS.lms.startTraining);
  return unwrap(response);
}

/**
 * The training record → the shape the app's plan store already speaks.
 *
 * The first four fields are exactly what `normalizeInsuranceType` produces, on
 * purpose: a plan hydrated from the server and a plan built from the choice
 * screen have to be indistinguishable downstream, or every screen would need to
 * know which one it got.
 *
 * `sectionIds` is still derived locally from the name, because the server names
 * the line ("Life Insurance") but says nothing about our syllabus sections.
 *
 * Of the progress figures, only `completedHours` is read: it is the marker
 * `useTrainingClock` measures each `update-progress` delta against — what the
 * server is known to already hold.
 *
 * `remainingHours` is carried but deliberately *not* used, and the countdown no
 * longer seeds from it. It is the server's arithmetic over a count that only
 * moves when this app reports to it, so between two flushes it is stale by
 * construction; `remainingSeconds` derives from `trainingStartDate` instead and
 * the two agree whenever the LMS is up to date. Kept, like `status`, so a bug
 * report can show what the server actually said.
 */
const normalizeProgress = (data = {}) => ({
  id: data.insuranceTypeId ?? null,
  name: data.insuranceTypeName ?? '',
  requiredHours: Number(data.requiredHours) || 0,
  sectionIds: sectionIdsFor(data.insuranceTypeName),

  /** Epoch ms, or null while a record exists but the hours were never begun. */
  startedAt: data.trainingStartDate ? Date.parse(data.trainingStartDate) : null,

  /**
   * Epoch ms the hours were closed off — `trainingEndDate`, which only appears
   * once `complete-training` has been sent. Null on every record before that,
   * so it doubles as "has this period been settled?" in a bug report.
   */
  completedAt: data.trainingEndDate ? Date.parse(data.trainingEndDate) : null,

  completedHours: Number(data.completedHours) || 0,
  remainingHours: Number(data.remainingHours) || 0,

  /** The server's own 0–100 figure. Carried for display, never for gating. */
  progressPercentage: Number(data.progressPercentage) || 0,

  /**
   * The LMS's own word on the mandated hours — *not* on the exam. A POSP whose
   * hours are served still has a paper to sit; `certificationStore` owns that
   * flag and this must never be written into it.
   *
   * Named `hoursComplete` rather than carrying the server's `isTrainingCompleted`
   * through, precisely because "training completed" is the sentence that invites
   * the confusion. The hours are complete; the training is not.
   */
  hoursComplete: Boolean(data.isTrainingCompleted),

  /** Raw, so a bug report can show what the above was read from. */
  status: data.status ?? null,
  trainingId: data.trainingId ?? null,
});

/**
 * Enrol against the chosen line — `POST /lms/apply-for-training`.
 *
 * The same body as `selectInsuranceType` and sent straight after it: the
 * selection records which line, this creates the training row it hangs off.
 * Two calls rather than one because the server keeps them apart, and the second
 * is the one that answers with something worth keeping.
 *
 * Returns the record through `normalizeProgress`, so what the choice screen
 * hands the plan store is the same shape a resumed session hydrates from — the
 * server's `requiredHours` and `trainingId`, not a copy of the tapped option.
 * `status` comes back `Applied` with a null `trainingStartDate`, which is
 * exactly the ready screen's state: enrolled, clock not running.
 */
export async function applyForTraining(insuranceTypeId) {
  const response = await api.post(ENDPOINTS.lms.applyForTraining, {
    insuranceTypeId,
  });
  const data = unwrap(response);
  return data ? normalizeProgress(data) : null;
}

/**
 * This POSP's training record — `GET /lms/progress/{pospId}`.
 *
 * Resolves to null rather than rejecting when there is no record yet: a POSP who
 * has not chosen a line is the ordinary first-visit case, and the server has no
 * gentler way to say so than a 404. The caller reads null as "ask them to
 * choose", which is exactly right.
 *
 * Every other failure rejects, because they mean something different — the
 * record may well exist and be unreachable, and silently showing the choice
 * screen would invite a POSP to re-enrol in a programme they are already in.
 */
export async function fetchTrainingProgress(pospId) {
  try {
    const response = await api.get(ENDPOINTS.lms.progress(pospId));
    const data = unwrap(response);
    return data ? normalizeProgress(data) : null;
  } catch (err) {
    /* 404 is the plain "no record". `envelopeFailure` is the same answer in this
       backend's other dialect — a 200 carrying `success: false` — which the
       interceptor raises as an error and which, on a read this narrow, means
       nothing else. */
    if (err?.status === 404 || err?.envelopeFailure) return null;
    throw err;
  }
}

/**
 * Add served hours — `POST /lms/update-progress` { hoursToAdd }.
 *
 * ⚠ A delta. Two sends of the same hour count it twice, and nothing on the
 * server catches it — see the note on the endpoint. Whatever calls this owns
 * making sure each stretch of time is sent exactly once.
 *
 * Returns the updated record in the same shape as `fetchTrainingProgress`, so
 * the reply can be adopted directly instead of prompting a re-read.
 */
export async function updateTrainingProgress(hoursToAdd) {
  const response = await api.post(ENDPOINTS.lms.updateProgress, { hoursToAdd });
  const data = unwrap(response);
  return data ? normalizeProgress(data) : null;
}

/**
 * Close the mandated hours — `POST /lms/complete-training`.
 *
 * The bookend to `startTraining`. The countdown reaching zero is this browser's
 * arithmetic over `trainingStartDate`; this is the call that makes the LMS agree,
 * and it answers with the settled record — `completedHours` topped up to
 * `requiredHours`, `remainingHours: 0`, `status: "Completed"`,
 * `isTrainingCompleted: true`, and the `trainingEndDate` stamp.
 *
 * Sent when the POSP presses "Start exam", not the instant the clock hits zero:
 * pressing it is the moment they say they are done, and a POSP who leaves the
 * tab open past the fifteenth hour has not asked for anything to be closed.
 *
 * ⚠ Ordering matters. Flush any outstanding `update-progress` delta *first* —
 * this settles the total, and a delta landing after it would be added on top of
 * a figure the server has already called final.
 *
 * The `Hours` on the end is load-bearing. This was `completeTraining`, which
 * collided outright with `completeTraining` in `shared/store/trainingStore` —
 * that one recorded the *exam* was passed, and `TrainingPage` imported both and
 * aliased one to keep them apart. Its replacement is `markCertified` in
 * `shared/store/certificationStore`; this one only ever speaks about hours, and
 * now says so.
 *
 * Returns the record through `normalizeProgress`, so the reply can be adopted
 * into the plan store exactly like a `GET /lms/progress` answer. No body — the
 * token says who and the record says which training.
 */
export async function completeTrainingHours() {
  const response = await api.post(ENDPOINTS.lms.completeTraining);
  const data = unwrap(response);
  return data ? normalizeProgress(data) : null;
}

/** The keys the handoff URL has been seen under, in the order they're trusted. */
const URL_KEYS = ['redirectUrl', 'lmsUrl', 'trainingUrl', 'url'];

const firstUrl = (data) => {
  for (const key of URL_KEYS) {
    const value = data?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

/**
 * Ask the LMS to clear this POSP for training — `POST /lms/verify-for-training`.
 *
 * ⚠ Named for what it asks, not for the endpoint, and that is deliberate. The
 * endpoint's "verify" is the LMS granting a seat on the course; everywhere else
 * in this app "verification" means the back office's KYC verdict
 * (`verificationStore`, `isVerified`, `acknowledgeVerification`). Its one caller
 * is `VerificationPendingPage`, which calls this and `acknowledgeVerification()`
 * on adjacent lines — two unrelated things, and under the old name
 * `verifyForTraining` they read as two halves of one.
 *
 * An approved profile is not the same as a seat: the KYC verdict says a reviewer
 * signed off, this says the LMS will have them.
 *
 * Returns `{ redirectUrl, data }`. `redirectUrl` is null when the reply is a
 * plain go-ahead, which is the caller's cue to stay in the app and route to
 * `/posp-training`; when it's a string the course lives elsewhere and that URL
 * is where the POSP belongs.
 *
 * Rejects with an ApiError like every other call, because this one is a gate —
 * a failure here has to stop the navigation, not be swallowed behind it.
 */
export async function requestTrainingAccess() {
  const response = await api.post(ENDPOINTS.lms.verifyForTraining);
  const data = unwrap(response) ?? {};

  return { redirectUrl: firstUrl(data), data };
}
