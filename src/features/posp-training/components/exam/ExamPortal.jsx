import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, TriangleAlert } from 'lucide-react';
import { saveAnswer, submitExam } from '../../api/examApi';
import { markCertified } from '@/shared/store/certificationStore';
import { useCountdown } from '../../hooks/useCountdown';
import CertificateScreen from '../certificate/CertificateScreen';
import { EXAM_SHELL } from './examShell';
import { TIME_WARNINGS } from './examTiming';
import ExamInstructions from './ExamInstructions';
import ExamResults from './ExamResults';
import ExamRunner from './ExamRunner';

/** The screens the portal moves between, in the order a learner meets them. */
const STAGE = {
  INSTRUCTIONS: 'instructions',
  PAPER: 'paper',
  /** Handing in: the call in flight, or having failed. Never a verdict. */
  SUBMITTING: 'submitting',
  RESULTS: 'results',
  CERTIFICATE: 'certificate',
};

/**
 * Seconds between now and the server's deadline.
 *
 * The clock is measured against `deadline` rather than seeded from
 * `remainingSeconds`, and the difference matters at exactly one moment: the
 * instructions screen. The server starts counting on `POST /exam/start`, which
 * is the press *before* this screen, so a learner who reads the guidelines for
 * four minutes has four fewer minutes of paper. Seeding from `remainingSeconds`
 * would hand those four minutes back — a clock that says twenty-eight while the
 * server is holding twenty-four, running out four minutes after the attempt was
 * already over.
 */
const secondsUntil = (deadline) =>
  deadline ? Math.max(0, Math.round((deadline - Date.now()) / 1000)) : 0;

/**
 * ExamPortal — the POSP certification exam, from instructions to verdict.
 *
 * The paper is the server's: `exam` is the attempt `POST /exam/start` opened,
 * carrying the `examId`, the questions with their own ids, and the deadline the
 * clock runs to. Nothing here is generated locally any more — the hardcoded
 * `examQuestions` bank it used to sit is gone, along with the answer key that
 * put the correct option at index 1 of every single question.
 *
 * One paper, not two sections. The server hands back one flat list with one
 * deadline and one mark total, so the section machinery that used to run two
 * banks against two clocks has nothing left to divide. The screens are
 * unchanged: they were only ever handed a `section` for its title and label, and
 * that is now the insurance line the POSP enrolled in.
 *
 * `answers` is keyed by the server's `questionId` → the index of the chosen
 * option, which is what `ExamRunner` and `ExamNavigator` already read. The index
 * is a local convenience; what goes to the server is the letter carried on the
 * option itself — see `selectOption`.
 */
function ExamPortal({ exam, planName, onExit, onFullBleedChange }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState(STAGE.INSTRUCTIONS);
  const [answers, setAnswers] = useState({});
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  /** The graded paper from `/exam/submit` — the only verdict there is. */
  const [result, setResult] = useState(null);

  /* A ref rather than the `submitting` state, because the two callers of
     `submitPaper` are a click and an interval tick, and the tick reads a closure
     that may be a render behind. A ref is current in both. */
  const submitInFlight = useRef(false);

  const questions = exam?.questions ?? [];

  /**
   * The one "section" the screens are handed.
   *
   * Synthesised rather than looked up in `SECTIONS`, because the server does not
   * divide the paper and neither should this. It exists only to give the header
   * a title and the navigator a label, and the honest answer to both is the line
   * the POSP enrolled in — "Life Insurance", the LMS's own words for it.
   */
  const section = useMemo(
    () => ({
      id: exam?.examId ?? 'exam',
      label: planName || 'Certification',
      title: planName || 'Certification Exam',
    }),
    [exam?.examId, planName]
  );

  /**
   * Whether the screen on the portal right now wants the viewport to itself,
   * reported up so the page can take its bar and footer off for it.
   *
   * Everything from the paper onward is a sitting: the clock is running or has
   * just stopped, and the app's chrome is somewhere to click away to. The
   * instructions are not a sitting — they are the gate in front of one, and a
   * learner can read them for as long as they like. Stripping the header and
   * footer off a page nothing is timing reads as a page that failed to load its
   * chrome rather than as a focused one, and it takes away the account menu at
   * the last moment they could still change their mind.
   *
   * Derived from the stage rather than tracked alongside it, so it cannot fall
   * out of step with the screen actually rendered below.
   */
  const isFullBleed = stage !== STAGE.INSTRUCTIONS;

  useEffect(() => {
    onFullBleedChange?.(isFullBleed);
  }, [isFullBleed, onFullBleedChange]);

  /**
   * The paper as `/exam/submit` wants it.
   *
   * Only answered questions go up — a question never reached has no letter, and
   * sending a placeholder would be answering for the learner. Built by walking
   * `questions` rather than the `answers` object so the list arrives in paper
   * order, which makes a request log readable next to the paper it came from.
   */
  const answerPayload = (given) =>
    questions
      .filter((question) => given[question.id] !== undefined)
      .map((question) => ({
        questionId: question.id,
        selectedAnswer: question.options[given[question.id]]?.letter,
      }))
      .filter((entry) => Boolean(entry.selectedAnswer));

  /**
   * Hand the paper in.
   *
   * Called two ways — the submit dialog's confirm, and the clock reaching zero —
   * and it has to behave the same either way: a paper abandoned to the deadline
   * is still a paper handed in, and leaving the attempt open would strand it.
   *
   * The clock stops first and the stage moves before the call, so the learner is
   * off the paper the moment they commit. A failure is reported on the screen
   * they land on, with the press offered again — the answers are still in state
   * and the attempt is still open, so retrying is the right and only move. What
   * must not happen is a "submitted" screen over a submit that never landed.
   */
  const submitPaper = useCallback(
    async (given) => {
      if (submitInFlight.current) return;

      submitInFlight.current = true;
      setSubmitError(null);

      try {
        const graded = await submitExam({
          examId: exam.examId,
          answers: answerPayload(given),
        });

        /* A resolved call with nothing in it is not a pass and must not be
           shown as a verdict — `ExamResults` reads `passed` off this, and an
           empty object reads as a fail the learner may not have earned. Treated
           as a failed submit so the press is offered again. */
        if (!graded) {
          setSubmitError(new Error('The exam was submitted but no result came back.'));
          return;
        }

        setResult(graded);
        setStage(STAGE.RESULTS);
      } catch (err) {
        setSubmitError(err);
      } finally {
        submitInFlight.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exam?.examId, questions]
  );

  /** Stop the clock and hand the paper in — the same ending whether time ran
   *  out or the learner submitted early. */
  const finishPaper = () => {
    setIsClockRunning(false);
    setStage(STAGE.SUBMITTING);
    submitPaper(answers);
  };

  /* Seeded from the server's own figure so the first paint is right, then reset
     against the deadline the moment the paper opens — see `secondsUntil`. */
  const { secondsLeft, reset } = useCountdown(exam?.remainingSeconds ?? 0, {
    running: isClockRunning,
    onTick: (remaining) => {
      const warning = TIME_WARNINGS.find((entry) => entry.at === remaining);
      if (warning) setToast(warning.message);
      if (remaining === 0) finishPaper();
    },
  });

  const startPaper = () => {
    setStage(STAGE.PAPER);
    setToast(null);
    reset(secondsUntil(exam.deadline));
    setIsClockRunning(true);
  };

  /**
   * Answer a question — locally at once, on the server just behind it.
   *
   * The press is not awaited. An exam is timed, and making a tile wait on a
   * round trip spends the learner's seconds on the network; the selection is
   * theirs the instant they make it and the save catches up. A failure surfaces
   * as a toast rather than by reverting the tile, because the answer they gave
   * is still the answer they meant — what is wrong is the record of it, and
   * pressing again is the fix.
   *
   * The letter is read off the option rather than computed from `optionIndex`.
   * That is not tidiness: a question missing one of its four columns is dropped
   * from the list by `normalizeQuestion`, and an index would then name the wrong
   * letter for every tile after the gap.
   */
  const selectOption = (questionId, optionIndex) => {
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));

    const question = questions.find((entry) => entry.id === questionId);
    const letter = question?.options[optionIndex]?.letter;
    if (!exam?.examId || !questionId || !letter) return;

    saveAnswer({ examId: exam.examId, questionId, selectedAnswer: letter }).catch(() => {
      setToast("Couldn't save that answer. Select it again before you submit.");
    });
  };

  /**
   * Take an answer back — on this screen only.
   *
   * There is no clear route on the server, so an answer once saved stays saved.
   * This empties the tile and the navigator dot, and the last letter sent
   * remains on file. Worth knowing before reading a result: a question the
   * learner cleared and left alone is still answered as far as the server is
   * concerned.
   */
  const clearAnswer = (questionId) => {
    setAnswers((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  };

  // Stable identity: the toast schedules its own dismissal off this, and the
  // portal re-renders every second while the clock runs.
  const dismissToast = useCallback(() => setToast(null), []);

  /* The attempt opened but came back with nothing to sit. `TrainingPage` only
     mounts this on a resolved `POST /exam/start`, so this is the narrow case of
     a reply that carried no questions — worth saying plainly rather than
     crashing on `questions[0]` one component down. */
  if (!exam || questions.length === 0) {
    return (
      <div className={`${EXAM_SHELL} flex items-center justify-center bg-slate-50 p-6`}>
        <div className="w-full max-w-sm border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            No questions were returned
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            The exam opened but came back empty. Please contact support before trying again — this
            attempt has already been recorded.
          </p>
        </div>
      </div>
    );
  }

  if (stage === STAGE.INSTRUCTIONS) {
    return (
      <ExamInstructions
        sections={[section]}
        sectionMinutes={Math.round(exam.durationSeconds / 60)}
        onStart={startPaper}
      />
    );
  }

  /**
   * Handing in — in flight, or having failed. Never a verdict.
   *
   * The failure state is the one that earns this screen. The attempt is still
   * open and the answers are still in state, so the press is offered again
   * rather than dressed up as a result — a "submitted" screen over a submit that
   * never landed is the one outcome worth writing code to prevent.
   *
   * There is no success state here: a graded reply moves straight to
   * `STAGE.RESULTS`.
   */
  if (stage === STAGE.SUBMITTING) {
    return (
      <div className={`${EXAM_SHELL} flex items-center justify-center bg-slate-50 p-6 md:p-10`}>
        <div className="h-fit w-full max-w-md border border-slate-200 bg-white p-8 text-center md:p-10">
          <div
            className={`mx-auto mb-6 flex h-11 w-11 items-center justify-center border ${
              submitError
                ? 'border-error/30 bg-error/5 text-error'
                : 'border-primary/25 bg-primary/8 text-primary'
            }`}
          >
            {submitError ? (
              <TriangleAlert size={20} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Loader2
                size={20}
                strokeWidth={2}
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            )}
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {submitError ? "Your exam wasn't submitted" : 'Submitting your exam…'}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {submitError ? (
              <>
                {submitError.message ?? 'The submission did not go through.'} Your answers are still
                here — press again to send them.
              </>
            ) : (
              'Sending your answers. Please stay on this page.'
            )}
          </p>

          {submitError && (
            <button
              type="button"
              onClick={() => submitPaper(answers)}
              className="mt-8 flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Submit again
            </button>
          )}
        </div>
      </div>
    );
  }

  /**
   * The verdict, exactly as the server graded it.
   *
   * Every figure below is copied from the reply — none is counted, derived or
   * compared here. `passed` is `isPassed`; it is never `percentage` measured
   * against a pass mark of this app's own, because the paper carried no answer
   * key and a browser that grades an exam it cannot grade is a browser that will
   * eventually disagree with the certificate it prints.
   */
  if (stage === STAGE.RESULTS && result) {
    return (
      <ExamResults
        results={[
          {
            section,
            score: {
              passed: result.passed,
              obtainedMarks: result.obtainedMarks,
              totalMarks: result.totalMarks,
              percentage: result.percentage,
              message: result.message,
            },
          },
        ]}
        onViewCertificate={() => {
          /* Reaching the certificate means the server passed them — this is the
             moment the dashboard unlocks. Flipped here rather than on the Go to
             Dashboard button so the guard in `app/funnel.js` is satisfied before
             that navigation fires. Gated on `result.passed`, which is the
             server's `isPassed`: this app cannot grade the paper and must never
             appear to. */
          if (!result.passed) return;
          markCertified();
          setStage(STAGE.CERTIFICATE);
        }}
        onExit={onExit}
      />
    );
  }

  // Only ever reached from a pass, so the certificate cannot be opened on a
  // failed attempt. Nothing routes here yet — see the note above.
  if (stage === STAGE.CERTIFICATE) {
    return <CertificateScreen onAction={() => navigate('/overview')} />;
  }

  return (
    <ExamRunner
      key={section.id}
      section={section}
      questions={questions}
      answers={answers}
      secondsLeft={secondsLeft}
      totalSeconds={exam.durationSeconds}
      toast={toast}
      onDismissToast={dismissToast}
      onSelectOption={selectOption}
      onClearAnswer={clearAnswer}
      onSubmitSection={finishPaper}
    />
  );
}

export default ExamPortal;
