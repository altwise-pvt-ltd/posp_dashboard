import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * The option columns, paired with the letter each one answers as.
 *
 * The server sends four flat columns (`optionA`…`optionD`) rather than a list,
 * so the order is this array's rather than the payload's — object key order is
 * not a contract, and an exam that shuffled its options between two renders
 * would invalidate an answer the learner had already given.
 *
 * The letter is written down beside the column rather than derived from a
 * position later, and that is the whole point of the pairing. `save-answer`
 * wants `"A"`–`"D"`, a blank column is dropped from the list below, and the two
 * facts together are a bug waiting to happen: a question with no `optionB`
 * leaves `optionC` sitting at index 1, and anything computing a letter from an
 * index would answer "B" for the tile printed "C". Carried this way, the letter
 * cannot drift from the column it came from however the list is filtered.
 */
const OPTION_FIELDS = [
  ['A', 'optionA'],
  ['B', 'optionB'],
  ['C', 'optionC'],
  ['D', 'optionD'],
];

/**
 * One question → the shape the exam screens already speak.
 *
 * `id` and `question` are deliberately the field names the exam components
 * already read, so `ExamRunner`, `ExamQuestion` and `ExamNavigator` take a
 * server question without knowing it came from the server.
 *
 * `options` is a list of `{ letter, text }`. A blank column is dropped rather
 * than rendered as an empty tile, which is what lets a future two- or
 * three-option question through unchanged — and why the letter travels with the
 * text; see above.
 *
 * There is no `correctOption`, and there cannot be — see the note on the
 * endpoint. Anything that grades this paper has to ask the server.
 */
const normalizeQuestion = (entry = {}) => ({
  id: entry.questionId ?? null,
  question: entry.questionText ?? '',
  options: OPTION_FIELDS.map(([letter, field]) => ({ letter, text: entry[field] })).filter(
    (option) => typeof option.text === 'string' && option.text.trim() !== ''
  ),
  marks: Number(entry.marks) || 0,
});

/**
 * The attempt → the app's session object.
 *
 * The two stamps are parsed to epoch ms like everything else in this feature
 * (`normalizeProgress` does the same with `trainingStartDate`), so the rest of
 * the app never handles the raw `+05:30` strings.
 *
 * `deadline` is the one to trust for the clock rather than `remainingSeconds`:
 * the latter is true at the instant the reply was written and starts going stale
 * on the wire, while the deadline is an absolute the browser can keep measuring
 * against. `remainingSeconds` is kept because it is the server's own arithmetic
 * and a bug report is much easier to read when the two can be compared.
 */
const normalizeExam = (data = {}) => ({
  examId: data.examId ?? null,
  pospId: data.pospId ?? null,
  insuranceTypeId: data.insuranceTypeId ?? null,

  /** The server's count of sittings — 1 on a first attempt, not 0. */
  attemptNo: Number(data.attemptNo) || 0,

  startedAt: data.examStartTime ? Date.parse(data.examStartTime) : null,
  deadline: data.deadline ? Date.parse(data.deadline) : null,
  durationSeconds: (Number(data.durationMinutes) || 0) * 60,
  remainingSeconds: Number(data.remainingSeconds) || 0,

  totalQuestions: Number(data.totalQuestions) || 0,
  totalMarks: Number(data.totalMarks) || 0,

  /** Raw, so a bug report can show what the server actually said. */
  status: data.status ?? null,

  questions: Array.isArray(data.questions) ? data.questions.map(normalizeQuestion) : [],
});

/**
 * May this POSP sit the paper? — `GET /exam/eligibility`.
 *
 * The one call in this file that costs nothing. `/exam/start` answers the same
 * question but charges an attempt for it, so before this existed the only way to
 * find out whether someone could sit was to make them sit.
 *
 * `eligible` and `alreadyPassed` are decisions, not hints — the caller obeys
 * them rather than reasoning about them. `reason` is the server's own sentence
 * and is shown as written: whether a failed attempt means going straight back in
 * or re-applying for the training is the examiner's rule, and an app that
 * paraphrased it would be guessing at a policy it does not hold.
 *
 * Rejects on failure rather than resolving to a permissive default. "We could
 * not ask" is not "yes", and treating it as one would open the caution dialog in
 * front of a `/exam/start` that is about to be refused — after the warning about
 * spending an attempt has already been read and accepted.
 */
export async function fetchExamEligibility() {
  const response = await api.get(ENDPOINTS.exam.eligibility);
  const data = unwrap(response);
  if (!data) return null;

  return {
    pospId: data.pospId ?? null,

    /** The gate. */
    eligible: Boolean(data.isEligible),

    /** Already certified — there is nothing here for them to sit. */
    alreadyPassed: Boolean(data.alreadyPassed),

    /** The server's sentence, shown as written. */
    reason: data.reason ?? '',

    insuranceTypeId: data.insuranceTypeId ?? null,
    insuranceTypeName: data.insuranceTypeName ?? '',

    /** Which sitting the next `/exam/start` would be. */
    nextAttemptNo: Number(data.nextAttemptNo) || 0,
  };
}

/**
 * Open an attempt and collect the paper — `POST /exam/start`.
 *
 * Sent the moment the POSP accepts the caution, which is the only press that
 * can honestly spend an attempt: the server stamps `examStartTime`, sets a
 * `deadline` and increments `attemptNo` on this call, so a fetch on mount would
 * have burned a sitting for anyone who merely landed on the screen.
 *
 * ⚠ Not idempotent. Two sends are two attempts, and the caller owns not
 * pressing twice — `TrainingPage` guards the handler for exactly this reason.
 *
 * No body — the same arrangement `startTraining` and the two accepts use. The
 * token says who, and the LMS record already says which line they enrolled in;
 * the `insuranceTypeId` on the reply is the server telling us what it picked,
 * not an echo of something we sent. Sending it anyway would be a second copy of
 * a fact the server is holding, able to disagree with the one it trusts.
 *
 * Rejects on failure rather than resolving empty. The caution is still on
 * screen at that point and staying there with the reason is the right outcome:
 * an exam opened with no questions is worse than one that did not open.
 */
export async function startExam() {
  const response = await api.post(ENDPOINTS.exam.start);
  const data = unwrap(response);
  return data ? normalizeExam(data) : null;
}

/**
 * Record one answer — `POST /exam/save-answer`.
 *
 * Sent on every option press, so the paper is on the server as it is answered
 * rather than only at the end. All three fields are the server's own
 * identifiers: `examId` from the attempt, `questionId` from the question, and
 * `selectedAnswer` the letter carried on the option the learner pressed. None of
 * them is derived from a position in a list — see `OPTION_FIELDS`.
 *
 * Rejects like every other call, and the caller decides what that is worth. It
 * is deliberately *not* awaited in front of the selection: an exam is timed, and
 * making the tile wait on a round trip would spend the learner's seconds on the
 * network. The press lands locally at once and the failure is reported after the
 * fact — see `selectOption` in `ExamPortal`.
 *
 * Safe to re-send for the same question: the last letter to arrive is the one on
 * file, which is what lets a learner change their mind.
 */
export async function saveAnswer({ examId, questionId, selectedAnswer }) {
  const response = await api.post(ENDPOINTS.exam.saveAnswer, {
    examId,
    questionId,
    selectedAnswer,
  });
  return unwrap(response);
}

/**
 * The graded paper → the shape the results screen reads.
 *
 * `isPassed` is the verdict and the only thing that should ever decide it. The
 * percentage is carried for display and `result` ("Pass" / "Fail") is the
 * server's own word for the same fact, kept raw so a bug report can show the two
 * agreeing — but neither is what the certificate is gated on. Comparing
 * `percentage` against a pass mark held in this app would be this browser
 * re-grading a paper it was never given the answers to.
 *
 * Marks, not question counts. `obtainedMarks` is out of `totalMarks`, and the
 * two happen to equal the question count on the current paper only because every
 * question is worth one mark. The results card says "marks" for that reason.
 *
 * `message` is the sentence the server wrote — it states the score and the pass
 * mark together — and is shown as-is rather than reassembled from the figures.
 */
const normalizeResult = (data = {}) => ({
  examId: data.examId ?? null,
  attemptNo: Number(data.attemptNo) || 0,

  totalQuestions: Number(data.totalQuestions) || 0,
  totalMarks: Number(data.totalMarks) || 0,
  obtainedMarks: Number(data.obtainedMarks) || 0,
  percentage: Number(data.percentage) || 0,

  /** The verdict. The one field the certificate may be gated on. */
  passed: Boolean(data.isPassed),

  /** The attempt ran past its deadline rather than being handed in. */
  expired: Boolean(data.isExpired),

  /** Raw, so a bug report can show what the above was read from. */
  result: data.result ?? null,
  status: data.status ?? null,
  message: data.message ?? '',
});

/**
 * Hand the paper in — `POST /exam/submit`.
 *
 * `answers` is the whole paper at once: `[{ questionId, selectedAnswer }]`, the
 * letter again rather than an index. Unanswered questions are simply absent —
 * the caller builds the list from what was actually chosen.
 *
 * Rejects on failure, and that matters more here than anywhere else in this
 * file. Every other call in the exam flow has a sensible thing to do when it
 * fails; this one does not. A submit that quietly failed would leave a learner
 * looking at a "submitted" screen with an attempt still open on the server and
 * no result coming, so the caller has to keep them on the screen and offer the
 * press again.
 *
 * Returns the graded result through `normalizeResult`. Grading is the server's —
 * the paper carried no answer key — so this reply is the whole verdict, and
 * nothing downstream should recompute any part of it.
 */
export async function submitExam({ examId, answers }) {
  const response = await api.post(ENDPOINTS.exam.submit, { examId, answers });
  const data = unwrap(response);
  return data ? normalizeResult(data) : null;
}
