import { createFlagStore } from './createFlagStore';

/**
 * Whether the POSP has **passed the certification exam**. Nothing else.
 *
 * ── On the name ───────────────────────────────────────────────────────────
 *
 * This file was `trainingStore.js`, and every export was named `*Training*`:
 * `isTrainingComplete`, `completeTraining`, `resetTraining`. All three were
 * lies of exactly one word — none of them says anything about *training*, they
 * say the exam was cleared. The storage key underneath has always been
 * `trainingCertified`, which was the honest name all along.
 *
 * It caused two collisions worth naming, because both were live:
 *
 *   `completeTraining` also exists in `posp-training/api/trainingApi.js`, where
 *   it POSTs `/lms/complete-training` and closes the mandated *hours*. Two
 *   functions, one name, opposite halves of the programme — `TrainingPage`
 *   imported both and had to alias one at the import to tell them apart.
 *
 *   `isTrainingComplete` read as the twin of `plan.hoursComplete`, which is the
 *   LMS's word on the hours. They are not twins: a POSP can have every hour
 *   served and still have a paper to sit.
 *
 * So the names here now match the flag: certification, not training. The
 * counterpart is `trainingPlanStore`, which holds the actual training — the
 * line, the hours, the start stamp.
 *
 * ⚠ The storage key stays `trainingCertified`. It is the one thing that must
 * NOT be renamed: it is already in every certified POSP's localStorage, and
 * changing it would read them all as uncertified and walk them back into the
 * funnel.
 *
 * Last gate of the four — after auth, onboarding and back-office verification —
 * and the one that answers "are you licensed to sell yet?". See `app/funnel.js`
 * for the order they run in.
 */
export const useCertificationStore = createFlagStore('trainingCertified');

/**
 * Hook-free helpers so non-React code (the funnel's stage list, the exam
 * portal's certificate handler) can read/flip the flag without a component:
 *   if (isCertified()) navigate('/overview');
 */
export const isCertified = () => useCertificationStore.getState().value;

/**
 * Called the moment the learner reaches the certificate — i.e. on a pass, or on
 * `alreadyPassed` from `/exam/eligibility` for someone who passed elsewhere. A
 * failed attempt never gets here, so the dashboard stays locked.
 *
 * ⚠ Not `completeTrainingHours` in `posp-training/api/trainingApi.js`. That one
 * closes the mandated hours on the LMS and says nothing about the exam.
 */
export const markCertified = () => useCertificationStore.getState().setValue(true);

/** Mostly for dev/testing — sends the user back through the programme. */
export const resetCertification = () => useCertificationStore.getState().setValue(false);
