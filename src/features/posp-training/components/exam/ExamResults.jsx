import { motion } from 'framer-motion';
import { ArrowRight, BookText, Check } from 'lucide-react';
import { EXAM_SHELL } from './examShell';
import SectionScoreCard from './SectionScoreCard';

/**
 * The verdict.
 *
 * Every section has to be cleared on its own, so the overall result is only as
 * good as the weakest card below it — and the one way forward changes with it:
 * on to the certificate, or back through the training. The dashboard is a step
 * further on, behind the certificate, so a pass ends on the thing the learner
 * came for rather than on a redirect.
 *
 * `results` arrives already scored, one `{ section, score }` per section sat:
 * the portal holds both the answers and the question bank, so it does the
 * scoring and this screen stays presentation, like every other exam screen.
 */
function ExamResults({ results, onViewCertificate, onRetakeTraining }) {
  const passed = results.every((result) => result.score.passed);

  return (
    <div
      className={`${EXAM_SHELL} flex justify-center overflow-y-auto border border-slate-200 bg-slate-50 p-6 md:p-10`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="h-fit w-full max-w-3xl border border-slate-200 bg-white p-8 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-10"
      >
        <div
          className={`mb-6 flex h-11 w-11 items-center justify-center border ${
            passed
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : 'border-error/30 bg-error/5 text-error'
          }`}
        >
          {passed ? (
            <Check size={22} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <BookText size={20} strokeWidth={2} aria-hidden="true" />
          )}
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {passed ? 'Certification complete' : 'Not cleared yet'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {passed
            ? 'You cleared every section. Your POSP certificate is ready.'
            : 'Every section has to be cleared on its own. Work back through the material and sit the exam again.'}
        </p>

        {/* A single section has no second column to balance against, so it is
            left at a readable width instead of stretched across the page. */}
        <div
          className={`mt-8 grid grid-cols-1 gap-4 ${results.length > 1 ? 'md:grid-cols-2' : 'max-w-sm'}`}
        >
          {results.map(({ section, score }) => (
            <SectionScoreCard key={section.id} title={section.title} score={score} />
          ))}
        </div>

        <button
          type="button"
          onClick={passed ? onViewCertificate : onRetakeTraining}
          className="mt-8 flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {passed ? 'View Certificate' : 'Start Training Again'}
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </motion.div>
    </div>
  );
}

export default ExamResults;
