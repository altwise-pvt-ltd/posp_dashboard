import { useState } from 'react';
import { HeartPulse, ShieldCheck } from 'lucide-react';
import BrandTopbar from '@/shared/layouts/BrandTopbar';
import OnboardingFooter from '@/features/onboarding/components/OnboardingFooter';
import { SECTIONS } from '../data/sections';
import { trainingModules } from '../data/trainingModules';
import { useCountdown } from '../hooks/useCountdown';
import VerificationCompleteCard from '../components/VerificationCompleteCard';
import ExamPortal from '../components/exam/ExamPortal';
import SectionSyllabus from '../components/training/SectionSyllabus';
import TrainingCompleteCard from '../components/training/TrainingCompleteCard';
import TrainingProgressRail from '../components/training/TrainingProgressRail';

/** The mandated study period, in seconds. One definition — the countdown, the
 *  progress bar and the reset after a retake all read it. */
const TRAINING_SECONDS = 15 * 60 * 60;

/** Section id → the icon that stands for it. Kept out of `sections.js` so the
 *  data layer stays free of presentation. */
const SECTION_ICONS = {
  general: ShieldCheck,
  life: HeartPulse,
};

/** The syllabus as the page renders it: every section that has material, with
 *  its icon and modules attached. Built once — none of it depends on state. */
const SYLLABUS_SECTIONS = SECTIONS.map((section) => ({
  ...section,
  icon: SECTION_ICONS[section.id],
  modules: trainingModules[section.id] ?? [],
})).filter((section) => section.modules.length > 0);

/**
 * TrainingPage — the 15-hour POSP programme, start to certificate.
 *
 * Four screens behind one route, chosen from two flags and the clock rather
 * than a stage variable, so they cannot disagree with each other:
 *   intro     — the verification-complete card, before the clock starts
 *   studying  — syllabus and countdown
 *   complete  — hours done, exam unlocked
 *   exam      — the exam portal, full bleed
 */
function TrainingPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const { secondsLeft, reset } = useCountdown(TRAINING_SECONDS, { running: hasStarted });

  const isTrainingComplete = secondsLeft === 0;

  const handleRetakeTraining = () => {
    setIsExamOpen(false);
    reset(TRAINING_SECONDS);
  };

  const renderStage = () => {
    if (isExamOpen) {
      return <ExamPortal onRetakeTraining={handleRetakeTraining} />;
    }

    if (!hasStarted) {
      /* `training-scale` is scoped to the intro so the card matches the
         standalone /verification-complete page; the syllabus and exam below
         keep the app's base scale. */
      return (
        <div className="training-scale flex w-full flex-1 flex-col items-center justify-center p-4 md:p-8">
          <VerificationCompleteCard onStart={() => setHasStarted(true)} />
        </div>
      );
    }

    if (isTrainingComplete) {
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
            Training in progress
          </span>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            You're one step closer to becoming a POSP
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Work through the General and Life Insurance material below at your own pace. Your
            certification exam with{' '}
            <span className="font-semibold text-slate-700">Lets Insurance Broker</span> unlocks once
            the 15 hours are complete.
          </p>
        </header>

        {/* `self-start` keeps the rail its own height inside the two-row span —
            a stretched grid item has nothing left to slide against and sticky
            would never engage. top-24 clears the brand bar. */}
        <aside className="anim-fade-d1 self-start lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <TrainingProgressRail
            secondsLeft={secondsLeft}
            totalSeconds={TRAINING_SECONDS}
            onSkip={() => reset(0)}
          />
        </aside>

        <div className="anim-fade-d1 space-y-10 lg:col-start-1 lg:row-start-2">
          {SYLLABUS_SECTIONS.map(({ id, title, icon, modules }) => (
            <SectionSyllabus key={id} title={title} icon={icon} modules={modules} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* The exam is a focused, full-bleed view — no chrome around it. The
          footer is gated the same way. `main` holds flex-1, so on the short
          screens it settles at the bottom of the viewport rather than riding up
          under the content. */}
      {!isExamOpen && <BrandTopbar />}

      <main className={`flex w-full flex-1 flex-col ${isExamOpen ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
        {renderStage()}
      </main>

      {!isExamOpen && <OnboardingFooter />}
    </div>
  );
}

export default TrainingPage;
