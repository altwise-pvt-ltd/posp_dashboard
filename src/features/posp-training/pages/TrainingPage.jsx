import { useMemo, useState } from 'react';
import { HeartPulse, ShieldCheck } from 'lucide-react';
import FunnelLayout from '@/shared/layouts/FunnelLayout';
import {
  markTrainingStarted,
  remainingSeconds,
  selectTrainingPlan,
  useTrainingPlanStore,
} from '@/shared/store/trainingPlanStore';
import { SECTIONS } from '../data/sections';
import { trainingModules } from '../data/trainingModules';
import { useCountdown } from '../hooks/useCountdown';
import { useInsuranceTypes } from '../hooks/useInsuranceTypes';
import { selectInsuranceType, startTraining } from '../api/trainingApi';
import ExamPortal from '../components/exam/ExamPortal';
import InsuranceTypeChoice from '../components/training/InsuranceTypeChoice';
import SectionSyllabus from '../components/training/SectionSyllabus';
import TrainingCompleteCard from '../components/training/TrainingCompleteCard';
import TrainingProgressRail from '../components/training/TrainingProgressRail';
import TrainingStartCard from '../components/training/TrainingStartCard';

/** Section id → the icon that stands for it. Kept out of `sections.js` so the
 *  data layer stays free of presentation. */
const SECTION_ICONS = {
  general: ShieldCheck,
  life: HeartPulse,
};

/** Every section that has material, with its icon and modules attached. The
 *  chosen line narrows this further — see `syllabus` below. */
const SYLLABUS_SECTIONS = SECTIONS.map((section) => ({
  ...section,
  icon: SECTION_ICONS[section.id],
  modules: trainingModules[section.id] ?? [],
})).filter((section) => section.modules.length > 0);

/**
 * TrainingPage — the POSP programme, start to certificate.
 *
 * Five screens behind one route, chosen from the plan and the clock rather than
 * a stage variable, so they cannot disagree with each other:
 *   choose    — which insurance line, before anything else exists
 *   ready     — enrolled, nothing running; the hours start on a press
 *   studying  — syllabus and countdown
 *   complete  — hours done, exam unlocked
 *   exam      — the exam portal, full bleed
 *
 * `choose` and `ready` are two screens rather than one because they are two
 * calls and two decisions: `select-insurance-type` records the line, and
 * `start-training` sets the mandated hours running. A POSP can sit on `ready`
 * for a week without spending any of their period.
 *
 * There is no "verification complete" intro. That confirmation now lives on
 * `/verification`, which renders all three verdicts itself — so arriving here
 * already *means* verified.
 */
function TrainingPage() {
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const plan = useTrainingPlanStore((s) => s.plan);
  const insuranceTypes = useInsuranceTypes();

  /* The mandated period is the server's number, not a constant — 15 hours for a
     single line, 30 for both. */
  const trainingSeconds = (plan?.requiredHours ?? 0) * 60 * 60;

  /* Seeded from `startedAt` rather than from the full period, so a reload picks
     the clock up where it left off instead of handing back the whole thing. The
     initial value is read once, at mount, which is exactly when that matters. */
  const { secondsLeft, reset } = useCountdown(remainingSeconds(plan), {
    running: Boolean(plan?.startedAt),
  });

  /** The syllabus cut to the chosen line. */
  const syllabus = useMemo(
    () =>
      plan
        ? SYLLABUS_SECTIONS.filter((section) => plan.sectionIds.includes(section.id))
        : [],
    [plan]
  );

  /* The clock running out, not the exam being passed — `isTrainingComplete` in
     trainingStore means the latter, so this deliberately doesn't share its name. */
  const hoursComplete = secondsLeft === 0;

  const handleRetakeTraining = () => {
    setIsExamOpen(false);
    reset(trainingSeconds);
  };

  /**
   * Record the line. Nothing starts here — the plan is persisted so the choice
   * survives a reload, and the ready screen takes it from there.
   */
  const handleChoosePlan = async (chosen) => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      await selectInsuranceType(chosen.id);
      selectTrainingPlan(chosen);
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
   * The clock is seeded at mount, so a start after that has to be put on it
   * explicitly: the countdown would otherwise sit at the zero it began with and
   * hand a fresh POSP a finished programme.
   */
  const handleStartTraining = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      await startTraining();
      markTrainingStarted();
      reset(trainingSeconds);
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStage = () => {
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
       otherwise fall through to the "hours complete" screen. */
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
      return (
        <ExamPortal
          sectionIds={plan.sectionIds}
          onRetakeTraining={handleRetakeTraining}
        />
      );
    }

    if (hoursComplete) {
      return (
        <div className="flex w-full flex-1 items-center justify-center py-10">
          <TrainingCompleteCard onStartExam={() => setIsExamOpen(true)} />
        </div>
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
        <header className="anim-fade lg:col-start-1 lg:row-start-1">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
            <span aria-hidden="true" className="pulse-dot size-2 rounded-full bg-orange-600" />
            {plan.name} · training in progress
          </span>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            You're one step closer to becoming a POSP
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Work through the material below at your own pace. Your certification exam with{' '}
            <span className="font-semibold text-slate-700">Lets Insurance Broker</span> unlocks once
            your {plan.requiredHours} hours are complete.
          </p>
        </header>

        {/* `self-start` keeps the rail its own height inside the two-row span —
            a stretched grid item has nothing left to slide against and sticky
            would never engage. top-24 clears the brand bar. */}
        <aside className="anim-fade-d1 self-start lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <TrainingProgressRail
            secondsLeft={secondsLeft}
            totalSeconds={trainingSeconds}
            onSkip={() => reset(0)}
          />
        </aside>

        <div className="anim-fade-d1 space-y-10 lg:col-start-1 lg:row-start-2">
          {syllabus.map(({ id, title, icon, modules }) => (
            <SectionSyllabus key={id} title={title} icon={icon} modules={modules} />
          ))}
        </div>
      </div>
    );
  };

  return (
    /* The exam is a focused, full-bleed view — both bar and footer come off for
       it. `main` holds flex-1, so on short screens it settles at the bottom of
       the viewport rather than riding up under the content. */
    <FunnelLayout
      header={isExamOpen ? 'none' : 'brand'}
      footer={!isExamOpen}
      className="bg-slate-50"
      mainClassName={`flex w-full flex-1 flex-col ${isExamOpen ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}
    >
      {renderStage()}
    </FunnelLayout>
  );
}

export default TrainingPage;
