import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, TriangleAlert } from 'lucide-react';
import FunnelLayout from '@/shared/layouts/FunnelLayout';
import {
  getTrainingPlan,
  hydrateTrainingPlan,
  markTrainingStarted,
  remainingSeconds,
  requiredSeconds,
  selectTrainingPlan,
  useTrainingPlanStore,
} from '@/shared/store/trainingPlanStore';
import { useCountdown } from '../hooks/useCountdown';
import { useCourseMaterial } from '../hooks/useCourseMaterial';
import { useExamEligibility } from '../hooks/useExamEligibility';
import { useInsuranceTypes } from '../hooks/useInsuranceTypes';
import { useTrainingClock } from '../hooks/useTrainingClock';
import { useTrainingRecord } from '../hooks/useTrainingRecord';
import {
  acceptTerms,
  acceptTrainingNorms,
  applyForTraining,
  completeTrainingHours,
  selectInsuranceType,
  startTraining,
  updateTrainingProgress,
} from '../api/trainingApi';
import { fetchExamEligibility, startExam } from '../api/examApi';
/* `completeTrainingHours` above closes the mandated *hours* on the LMS; this
   records that the *exam* was passed. Both used to be called `completeTraining`
   and this import carried an alias to tell them apart — the names now do it. */
import { markCertified } from '@/shared/store/certificationStore';
import CertificateScreen from '../components/certificate/CertificateScreen';
import ExamCautionDialog from '../components/exam/ExamCautionDialog';
import ExamPortal from '../components/exam/ExamPortal';
import InsuranceTypeChoice from '../components/training/InsuranceTypeChoice';
import StudyMaterial from '../components/training/StudyMaterial';
import TrainingCompleteCard from '../components/training/TrainingCompleteCard';
import TrainingProgressRail from '../components/training/TrainingProgressRail';
import TrainingStartCard from '../components/training/TrainingStartCard';

/**
 * TrainingPage — the gate, and `TrainingProgramme` below it the page proper.
 *
 * The split is not decoration. `useCountdown` seeds from `remainingSeconds(plan)`
 * *once*, at mount, which is the only time a countdown can be seeded — and the
 * plan does not exist until `GET /lms/progress` has answered. Rendering the
 * programme first and hydrating underneath it would start the clock from
 * whatever localStorage happened to hold (nothing at all, on a second device)
 * and then leave it running on that wrong number. Mounting the programme only
 * once the answer is in makes the ordering structural rather than a rule someone
 * has to remember.
 *
 * On failure it falls through rather than blocking, but only when there is a
 * local plan to fall through *to*: a stale plan is a worse answer than a fresh
 * one and a much better answer than an empty screen, while no plan at all would
 * leave the choice screen inviting a POSP to enrol a second time.
 */
function TrainingPage() {
  const { loading, error, retry } = useTrainingRecord();
  const plan = useTrainingPlanStore((s) => s.plan);

  if (loading) {
    return (
      <FunnelLayout
        header="brand"
        className="bg-slate-50"
        mainClassName="flex w-full flex-1 flex-col p-4 md:p-6 lg:p-8"
      >
        <div
          role="status"
          aria-live="polite"
          className="flex w-full flex-1 flex-col items-center justify-center gap-3 py-10"
        >
          <Loader2
            className="size-5 animate-spin text-orange-600 motion-reduce:animate-none"
            aria-hidden="true"
          />
          <p className="text-xs text-slate-500">Checking where you left off…</p>
        </div>
      </FunnelLayout>
    );
  }

  if (error && !plan) {
    return (
      <FunnelLayout
        header="brand"
        className="bg-slate-50"
        mainClassName="flex w-full flex-1 flex-col p-4 md:p-6 lg:p-8"
      >
        <div className="flex w-full flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_18px_44px_-24px_rgba(15,23,42,0.28)]">
            <span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <TriangleAlert className="size-4" aria-hidden="true" />
            </span>

            <h1 className="mt-4 text-base font-extrabold tracking-tight text-slate-900">
              Couldn't load your training
            </h1>
            <p className="mt-2 text-xs leading-5 text-slate-500">{error.message}</p>

            <button
              type="button"
              onClick={retry}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98]"
            >
              Try again
            </button>
          </div>
        </div>
      </FunnelLayout>
    );
  }

  return <TrainingProgramme />;
}

/**
 * The POSP programme, start to certificate.
 *
 * Four screens behind one route, chosen from the plan and the clock rather than
 * a stage variable, so they cannot disagree with each other:
 *   choose    — which insurance line, before anything else exists
 *   ready     — enrolled, nothing running; the hours start on a press
 *   studying  — the syllabus, and beside it either the countdown or, once the
 *               hours are served, the exam panel
 *   exam      — the exam portal, full bleed
 *
 * "Hours complete" used to be a fifth screen and is now a state of `studying`.
 * It replaced the entire page, syllabus included, so a POSP who enrolled and
 * came back a week later found the material they had paid the hours for gone —
 * at the one moment they most wanted to revise it, with an exam still to sit.
 * The hours running out ends the countdown, not the access.
 *
 * `choose` and `ready` are two screens rather than one because they are two
 * calls and two decisions: `select-insurance-type` records the line, and
 * `start-training` sets the mandated hours running. A POSP can sit on `ready`
 * for a week without spending any of their period.
 *
 * All five now start from the server's own training record — see `TrainingPage`
 * above. The plan reaching this component has been reconciled with
 * `GET /lms/progress`, so "which line" and "how many hours are left" are the
 * LMS's answers rather than this browser's memory of them.
 *
 * There is no "verification complete" intro. That confirmation now lives on
 * `/verification`, which renders all three verdicts itself — so arriving here
 * already *means* verified.
 */
function TrainingProgramme() {
  const navigate = useNavigate();
  const [isExamOpen, setIsExamOpen] = useState(false);
  /**
   * The pass `handleStartExam` heard about — a POSP who cleared the paper while
   * this page sat open, which the check on mount could not have known.
   *
   * Only ever the *press* path's answer. The mount path contributes through
   * `examEligibility` instead, and `isCertified` further down is where the two
   * meet — see there for why this half is state and that half is not.
   */
  const [passedOnPress, setPassedOnPress] = useState(false);
  /**
   * The caution between the settled record and the paper — see
   * `ExamCautionDialog`. Its own state rather than a stage, because the page
   * behind it is unchanged and should stay on screen: backing out of the
   * caution has to land them exactly where they pressed from.
   */
  const [isCautionOpen, setIsCautionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  /**
   * The attempt `POST /exam/start` opened, and the two states of that call.
   *
   * Kept here rather than inside `ExamPortal` because of what the call costs:
   * the server stamps `examStartTime`, sets a `deadline` and increments
   * `attemptNo` on it, so it has to be a press and not a mount. Fetching it one
   * level down would tie an attempt to the portal being rendered — a remount for
   * any reason would spend a second one.
   */
  const [examSession, setExamSession] = useState(null);
  const [examStarting, setExamStarting] = useState(false);
  const [examError, setExamError] = useState(null);
  /**
   * Whether the exam screen currently up wants the viewport to itself — the
   * portal reports it, because only the portal knows which of its five screens
   * is on (see `isFullBleed` there).
   *
   * The bar and the footer used to come off the moment `isExamOpen` flipped,
   * which took them off the instructions too. Nothing is timed on that screen;
   * it is the gate in front of the paper, and a page with no chrome at all reads
   * as broken rather than focused.
   *
   * Starts false so the instructions paint with their chrome already on rather
   * than losing it a frame later.
   */
  const [isExamFullBleed, setIsExamFullBleed] = useState(false);
  /** The dev "Skip timer" press, which is a real request now — see below. */
  const [skipping, setSkipping] = useState(false);
  const plan = useTrainingPlanStore((s) => s.plan);
  const insuranceTypes = useInsuranceTypes();

  /* The mandated period is the server's number, not a constant — 15 hours for a
     single line, 30 for both. */
  const trainingSeconds = requiredSeconds(plan);

  /* Seeded from `startedAt` — the server's own start stamp — so a reload picks
     the clock up where it stood rather than at the full period. Read once, at
     mount, which is why this component does not mount until the record has
     arrived. */
  const { secondsLeft, reset } = useCountdown(remainingSeconds(plan), {
    running: Boolean(plan?.startedAt),
  });

  /**
   * The study material, from the LMS — `GET /lms/course`.
   *
   * It used to be `trainingModules.js`, a hand-written list of chapters all
   * called "Chapter 1" and all linked to '#'. The real thing is published
   * against the insurance type, so the plan's id is what asks for it, and a POSP
   * who has not chosen yet passes null and gets nothing — see the hook.
   *
   * Fetched here, one level above where it renders, only because that keeps the
   * hook unconditional: the choice screen and the ready screen both mount this
   * component, and a hook inside `renderStage` would run on some renders and not
   * others.
   */
  const material = useCourseMaterial(plan?.id ?? null);

  /**
   * The examiner's verdict, asked once on the way in — `GET /exam/eligibility`.
   *
   * Two of this page's screens depend on an answer only the exam service holds:
   * a POSP who passed on another device is owed their certificate rather than a
   * syllabus, and one the server will refuse is owed the reason before they
   * accept a caution about spending an attempt. Both used to wait for a press.
   *
   * Unconditional, like every other hook here, so it does not run on some
   * renders and not others — a POSP with no plan yet simply gets a "not
   * enrolled" verdict this page has nothing to do with, and a failure changes
   * nothing at all. See the hook.
   */
  const examEligibility = useExamEligibility();

  /**
   * Whether this POSP already holds a pass — and the whole of the certificate
   * screen's state.
   *
   * Two sources answer the same question and this is where they meet: the mount
   * check just above, and `handleStartExam` for a pass recorded while this page
   * sat open. The press half is state because it is news arriving in a callback;
   * the mount half is derived, because storing it would mean setting state from
   * an effect the instant the fetch resolved — a second render pass for a value
   * that is a pure function of a reply already in hand.
   *
   * Either one is enough. Both are reports of the same fact, and a pass cannot
   * be taken back — so this is an `||` rather than a precedence rule.
   *
   * A boolean, because that is all the certificate screen needs: it fetches its
   * own document from `/certificates/me` and the sheet it frames is the server's
   * rendering. It used to be a `{ id, label, title }` section, back when the app
   * drew the sheet and had to name the line examined on it.
   */
  const isCertified =
    passedOnPress || Boolean(examEligibility.eligibility?.alreadyPassed);

  /**
   * Unlock the dashboard that the certificate screen's "Go to Dashboard" button
   * navigates to.
   *
   * An effect because it is a write to a store outside React, and it now covers
   * both routes to a pass at once rather than being a line each call site has to
   * remember. `ExamPortal` flips the same flag before moving to its own
   * certificate stage; otherwise it is only ever set by sitting the paper in
   * *this* browser — which a POSP who passed on another device never did.
   */
  useEffect(() => {
    if (isCertified) markCertified();
  }, [isCertified]);

  /**
   * Why the exam is shut, in the examiner's own words — or null while it is
   * open.
   *
   * Held apart from `submitError`, which belongs to whichever press last failed
   * (choosing a line, starting the hours, opening the paper). This is a standing
   * condition rather than a failed action, and folding it into that one slot
   * would make a refusal read as a button that did not work.
   *
   * `alreadyPassed` is excluded because it is not a refusal — that POSP is on
   * their way to the certificate screen, and "you can't sit this" is the wrong
   * sentence for having already cleared it.
   */
  const examBlockedReason =
    examEligibility.eligibility &&
    !examEligibility.eligibility.eligible &&
    !examEligibility.eligibility.alreadyPassed
      ? examEligibility.eligibility.reason ||
        "You can't sit the exam right now. Please contact support."
      : null;

  /**
   * *This browser's* countdown having reached zero. Deliberately not called
   * `hoursComplete`, because `plan.hoursComplete` is also in scope in this
   * component and is a different fact: the LMS's own word that the period has
   * been settled by `complete-training`.
   *
   * They disagree for a real interval — from the moment the clock hits zero
   * until the POSP presses "Start exam" and the server is told. Anything that
   * confused the two would either offer the exam against an `InProgress` record
   * or hide it from someone who has served their time.
   */
  const countdownFinished = secondsLeft === 0;

  /* Tell the LMS what has been served. Runs on its own beat, not on renders —
     `update-progress` adds rather than sets, so a second send of the same
     minutes counts them twice. */
  const { flushNow } = useTrainingClock(plan);

  /**
   * The clock reaching zero is the one moment worth reporting off-beat: the
   * screen behind it says the hours are done and offers the exam, and the LMS
   * gates that exam on a count that could otherwise still be five minutes short.
   */
  useEffect(() => {
    if (countdownFinished && plan?.startedAt) flushNow();
  }, [countdownFinished, plan?.startedAt, flushNow]);

  /**
   * Leave the exam and come back to the training page.
   *
   * The clock is deliberately *not* reset. The hours are served and
   * `complete-training` has settled them on the server; putting the countdown
   * back to the full period would take the exam panel off the screen and offer a
   * POSP their fifteen hours a second time, against a record the LMS already
   * reads as `Completed`.
   *
   * The attempt is dropped, though. It belonged to the paper just left, and
   * holding on to it would mean the next sitting carried the last one's `examId`
   * and its expired deadline — a fresh `POST /exam/start` is what a new sitting
   * is.
   */
  const handleExitExam = () => {
    setIsExamOpen(false);
    setIsExamFullBleed(false);
    setExamSession(null);
  };

  /**
   * The caution accepted — the only path into `ExamPortal`, and the press that
   * opens the attempt on the server.
   *
   * `POST /exam/start` is sent from here rather than from inside the portal
   * because this is the press the POSP was warned about: the server stamps the
   * start, fixes a deadline and counts the sitting, so the paper has to be in
   * hand *before* the screen changes. Opening the portal first and fetching
   * underneath it would put a learner in an exam that might have nothing to
   * show, with an attempt already spent either way.
   *
   * A failure keeps the caution up with the reason on it — see the dialog. The
   * hours are still settled, so nothing has been lost but the press.
   *
   * The guard is not a formality: the call is not idempotent, and a second press
   * while the first is in flight opens a second attempt against this POSP.
   *
   * Closing the dialog in the same tick as opening the exam matters: the portal
   * takes the whole viewport, and a dialog left mounted over it would be a
   * backdrop the learner can dismiss but nothing behind it to return to.
   */
  const handleEnterExam = async () => {
    if (examStarting) return;

    setExamStarting(true);
    setExamError(null);

    try {
      const session = await startExam();

      setExamSession(session);
      setIsCautionOpen(false);
      /* A second sitting opens on the instructions again, so the chrome has to
         come back with them — left true from the paper just abandoned, the
         instructions would paint bare for a frame. */
      setIsExamFullBleed(false);
      setIsExamOpen(true);
    } catch (err) {
      setExamError(err);
    } finally {
      setExamStarting(false);
    }
  };

  /* Stable identity: the dialog binds its Escape handler off this, and it is
     the same reason `dismissToast` in ExamPortal is a callback — a fresh
     function each render would tear that listener down and re-arm it.

     The error goes with the dialog. It described one press, and leaving it
     behind would put a stale failure on screen the next time the caution opens. */
  const handleCancelCaution = useCallback(() => {
    setIsCautionOpen(false);
    setExamError(null);
  }, []);

  /**
   * "Skip timer" — the dev affordance, made real.
   *
   * It used to `reset(0)` and nothing else, which only fooled this browser: the
   * exam is gated on the LMS's own `completedHours`, so a skipped countdown left
   * the server still holding zero hours and the programme still `InProgress`.
   * Now it hands the LMS the hours that are outstanding, and the clock on screen
   * and the count on the server reach the end together.
   *
   * `flushNow` first, for the same reason `handleStartExam` does it: it reports
   * the minutes genuinely served and refreshes `completedHours`, so the top-up
   * below is measured against what the server actually holds rather than against
   * a figure that is one beat stale.
   *
   * Nothing is *completed* here — that stays with the exam button and
   * `POST /lms/complete-training`. This only fast-forwards the hours, which is
   * all the button ever claimed to do.
   */
  const handleSkipTimer = async () => {
    if (skipping) return;
    setSkipping(true);

    try {
      await flushNow();

      /* Read back rather than reuse `plan`: `flushNow` may have just replaced it
         in the store, and this closure is still holding the old one. */
      const current = getTrainingPlan() ?? plan;
      const outstanding =
        Math.round(((current.requiredHours ?? 0) - (current.completedHours ?? 0)) * 100) / 100;

      if (outstanding > 0) {
        const record = await updateTrainingProgress(outstanding);

        /* Same `startedAt` guard the clock hook makes — a reply without a start
           stamp would drop the page back to the ready screen. */
        if (record) {
          hydrateTrainingPlan({
            ...record,
            startedAt: record.startedAt ?? current.startedAt,
          });
        }
      }
    } catch {
      /* Swallowed: it is a test button, and the local zero below still gets the
         tester to the exam screen. A toast here would be noise in the one flow
         nobody ships. */
    } finally {
      setSkipping(false);
      reset(0);
    }
  };

  /**
   * Record the line, then enrol against it. Nothing starts here — the plan is
   * persisted so the choice survives a reload, and the ready screen takes it
   * from there.
   *
   * Two calls with the same body, sequential because the second builds on the
   * first: `select-insurance-type` names the line, `apply-for-training` opens
   * the training row against it and answers with that row.
   *
   * The reply is what gets persisted, not `chosen`. It is the same normalized
   * shape a resumed session hydrates from — carrying the server's `trainingId`
   * and `requiredHours` — so a plan built here and a plan read back from
   * `GET /lms/progress` are indistinguishable downstream. `chosen` is the
   * fallback for a success that somehow carried no record, since the line was
   * still selected and stranding them on the choice screen would be worse.
   */
  const handleChoosePlan = async (chosen) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      await selectInsuranceType(chosen.id);
      const record = await applyForTraining(chosen.id);

      selectTrainingPlan(record ?? chosen);
      setSubmitting(false);
    } catch (err) {
      setSubmitError(err);
      setSubmitting(false);
    }
  };

  /**
   * Open the programme. The server is asked first and the local clock is only
   * started once it agrees — the reverse would leave a POSP counting down hours
   * the LMS never began.
   *
   * Three calls behind one press. The two consents are stamped first because
   * `start-training` is what they gate: a programme opened without them on file
   * is one the LMS cannot show was agreed to. The card only enables the button
   * once both boxes are ticked, so reaching here *is* the agreement.
   *
   * Sequential rather than concurrent — all three write the same training row,
   * and both accepts are safe to re-send, so a failure part-way can simply be
   * retried by pressing again.
   *
   * The clock is seeded at mount, so a start after that has to be put on it
   * explicitly: the countdown would otherwise sit at the zero it began with and
   * hand a fresh POSP a finished programme.
   */
  const handleStartTraining = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      await acceptTerms();
      await acceptTrainingNorms();
      await startTraining();
      markTrainingStarted();
      reset(trainingSeconds);
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * "Start exam" — settle the hours with the LMS first, then open the portal.
   *
   * The countdown hitting zero is *this browser's* arithmetic over `startedAt`.
   * The server keeps its own count and it only moves when this app reports to
   * it, so until `complete-training` is sent the record still reads `InProgress`
   * — and an exam sat against that record is an exam the LMS has no reason to
   * honour. The press is the moment the POSP says they are done, which is why it
   * is this handler and not the effect above that closes the period.
   *
   * Ordered, not concurrent: `flushNow` hands over the last unreported minutes,
   * then `complete-training` declares the total final. The reverse would add a
   * delta on top of a figure the server had already settled.
   *
   * A failure keeps them on this screen with the reason and the button intact.
   * Opening the exam anyway would spend their attempt on a record the LMS has
   * not cleared, which fails later and further from the cause.
   *
   * Success opens the caution, not the exam. The hours being settled is a
   * server fact and irreversible; the sitting is a browser fact and lost the
   * moment the tab is, so the two are worth separating by a press — see
   * `ExamCautionDialog`.
   */
  const handleStartExam = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      /* Settle the hours, unless the record already says they are settled — from
         an earlier press or from another device. A second `complete-training`
         would be asking the server to close a period twice, so the whole block is
         skipped rather than sent and ignored. This is also the path a POSP who
         backed out of the caution comes back through. */
      if (!plan?.hoursComplete) {
        /* Best effort by design: `flush` swallows its own failures and is a
           no-op if a scheduled beat happens to be in flight. The hours are still
           in `startedAt` either way, and `complete-training` tops the count up to
           the mandated figure regardless of what the last delta did. */
        await flushNow();

        const record = await completeTrainingHours();

        /* Adopt the settled record so the store, the rail and the LMS agree —
           `hoursComplete` true is also what stops `useTrainingClock` reporting.
           The `startedAt` guard is the same one the clock hook makes: a reply
           without a start stamp would drop the page back to the ready screen. */
        if (record) {
          hydrateTrainingPlan({
            ...record,
            startedAt: record.startedAt ?? plan.startedAt,
          });
        }
      }

      /**
       * Ask before warning them.
       *
       * The caution dialog's whole purpose is to say "this press spends an
       * attempt", and it is only honest if the press behind it would actually be
       * accepted. Opening it in front of a `/exam/start` the server is about to
       * refuse asks a POSP to accept a cost that was never on offer.
       *
       * Checked on every press rather than once on mount, because it is a
       * server-side verdict that a failed sitting on another device can change
       * while this page sits open. It costs one cheap GET and it is the last
       * thing between here and an attempt.
       */
      const eligibility = await fetchExamEligibility();

      /**
       * Already certified — so show them the certificate, not an error.
       *
       * This used to land as a red message on the training rail, which is the
       * wrong shape for the news: nothing has gone wrong, they have *passed*.
       * The only screen that has anything to say to a certified POSP is the
       * document itself, and this is the one reply that can prove they are
       * entitled to it.
       *
       * The mount check usually gets here first now — this path is what catches
       * a pass recorded on another device *while* this page sat open. Both hand
       * off to the same helper so they cannot drift.
       */
      if (eligibility?.alreadyPassed) {
        setPassedOnPress(true);
        return;
      }

      /* Refused, and the reason is the server's to give. Whether a failed
         attempt means going straight back in or re-applying for the training is
         the examiner's rule — this shows what it said rather than deciding. */
      if (eligibility && !eligibility.eligible) {
        setSubmitError(
          new Error(eligibility.reason || "You can't sit the exam right now. Please contact support.")
        );
        return;
      }

      setIsCautionOpen(true);
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStage = () => {
    /* Certified, on the server's word — see `handleStartExam`. First because it
       outranks every screen below it: a POSP holding a pass has no hours to
       serve, no exam to sit and nothing to choose. */
    if (isCertified) {
      return <CertificateScreen onAction={() => navigate('/overview')} />;
    }

    if (!plan) {
      return (
        <div className="flex w-full flex-1 items-center justify-center py-10">
          <InsuranceTypeChoice
            types={insuranceTypes.types}
            loading={insuranceTypes.loading}
            error={insuranceTypes.error}
            onRetry={insuranceTypes.retry}
            onConfirm={handleChoosePlan}
            submitting={submitting}
            submitError={submitError}
          />
        </div>
      );
    }

    /* Enrolled, but the hours haven't been set running yet. Checked before the
       clock, because an unstarted plan reads as zero seconds left and would
       otherwise offer the exam to someone who has served nothing. */
    if (!plan.startedAt) {
      return (
        <div className="flex w-full flex-1 items-center justify-center py-10">
          <TrainingStartCard
            plan={plan}
            starting={submitting}
            error={submitError}
            onStart={handleStartTraining}
          />
        </div>
      );
    }

    if (isExamOpen) {
      /* `exam` is the attempt the caution just opened — the paper, the examId
         and the server's deadline, and now what the portal actually sits. The
         local question bank it used to run is gone.

         `planName` is the LMS's own words for the line ("Life Insurance"), which
         is all the exam screens want a section for: a title on the header and a
         label on the navigator. `sectionIds` used to pick which local banks to
         sit and has nothing left to choose between — the server sends one
         paper. */
      return (
        <ExamPortal
          exam={examSession}
          planName={plan.name}
          onExit={handleExitExam}
          onFullBleedChange={setIsExamFullBleed}
        />
      );
    }

    /* The page scrolls; the rail sticks.

       Two explicit rows rather than a header stacked above the grid: the rail
       spans both, so it is a true second column measured against everything on
       the left — its top edge starts level with the page title instead of below
       it. Row/column placement (not `order`) does that while keeping the DOM
       order title → rail → syllabus, which is the right reading order once the
       grid collapses on a phone: the countdown is worth seeing before the file
       list. */
    return (
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-10 lg:gap-y-10">
        {/* One header, two readings of it. The dot stops pulsing once the hours
            are served — nothing is running any more — and the copy stops
            promising the exam and starts pointing at it. */}
        <header className="anim-fade lg:col-start-1 lg:row-start-1">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full bg-orange-600 ${countdownFinished ? '' : 'pulse-dot'}`}
            />
            {plan.name} · {countdownFinished ? 'hours complete' : 'training in progress'}
          </span>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {countdownFinished
              ? "You're ready for the exam"
              : "You're one step closer to becoming a POSP"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            {countdownFinished ? (
              <>
                Your {plan.requiredHours} hours are served and your certification exam with{' '}
                <span className="font-semibold text-slate-700">Lets Insurance Broker</span> is open.
                The material below stays yours — revise anything you like before you sit it.
              </>
            ) : (
              <>
                Work through the material below at your own pace. Your certification exam with{' '}
                <span className="font-semibold text-slate-700">Lets Insurance Broker</span> unlocks
                once your {plan.requiredHours} hours are complete.
              </>
            )}
          </p>
        </header>

        {/* `self-start` keeps the rail its own height inside the two-row span —
            a stretched grid item has nothing left to slide against and sticky
            would never engage. top-24 clears the brand bar. */}
        <aside className="anim-fade-d1 self-start lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {/* The one thing the served hours change. Everything to the left of
              this — title, material, downloads — is the same page it was a
              second before the clock hit zero. */}
          {countdownFinished ? (
            <TrainingCompleteCard
              requiredHours={plan.requiredHours}
              starting={submitting}
              error={submitError}
              blockedReason={examBlockedReason}
              onStartExam={handleStartExam}
            />
          ) : (
            <TrainingProgressRail
              secondsLeft={secondsLeft}
              totalSeconds={trainingSeconds}
              onSkip={handleSkipTimer}
              skipping={skipping}
            />
          )}
        </aside>

        <div className="anim-fade-d1 lg:col-start-1 lg:row-start-2">
          <StudyMaterial
            courses={material.courses}
            loading={material.loading}
            error={material.error}
            onRetry={material.retry}
          />
        </div>
      </div>
    );
  };

  /* The sitting is a focused, full-bleed view — both bar and footer come off for
     it, and `EXAM_SHELL` takes the viewport it leaves behind. The instructions
     screen in front of it is not a sitting and keeps its chrome, which is why
     this asks the portal rather than `isExamOpen`. Its own padding is generous
     enough that the shell's would only push it further in. */
  /* The certificate is full-bleed for a different reason than the paper: it
     carries its own sticky bar with the document's dates and a link out to the
     file, so a second header above it would be two bars saying overlapping
     things about one sheet. */
  const isFullBleed = (isExamOpen && isExamFullBleed) || isCertified;

  return (
    /* `main` holds flex-1, so on short screens the footer settles at the bottom
       of the viewport rather than riding up under the content. */
    <FunnelLayout
      header={isFullBleed ? 'none' : 'brand'}
      footer={!isFullBleed}
      className="bg-slate-50"
      mainClassName={`flex w-full flex-1 flex-col ${
        isExamOpen || isCertified ? 'p-0' : 'p-4 md:p-6 lg:p-8'
      }`}
    >
      {renderStage()}

      {/* Outside `renderStage` on purpose: it is an overlay on whatever that
          returned, not a sixth screen for it to choose between. The page it
          covers is the one the POSP pressed from, and backing out has to give
          it straight back. */}
      <ExamCautionDialog
        open={isCautionOpen}
        starting={examStarting}
        error={examError}
        onCancel={handleCancelCaution}
        onContinue={handleEnterExam}
      />
    </FunnelLayout>
  );
}

export default TrainingPage;
