import { motion } from 'framer-motion';
import { ArrowRight, BookText, Check } from 'lucide-react';
import { EXAM_SHELL } from './examShell';
import SectionScoreCard from './SectionScoreCard';

/**
 * The verdict.
 *
 * `results` arrives already graded — one `{ section, score }`, scored by the
 * server and passed straight through. This screen computes nothing: the paper
 * carried no answer key, so `passed` here is `isPassed` off `/exam/submit` and
 * not a percentage this app compared against a pass mark of its own.
 *
 * `message` is the server's own sentence about the score ("You scored 3.33%.
 * Passing score is 50.00%."). Shown when it is there, because it states the
 * result and the bar it was measured against in one line, in the words the
 * server will also have used anywhere else this attempt is reported.
 *
 * The way forward changes with the verdict: on to the certificate, or back to
 * the training page, where the material is still theirs and "Start exam" opens a
 * fresh attempt. The dashboard is a step further on, behind the certificate, so
 * a pass ends on the thing the learner came for rather than on a redirect.
 */
function ExamResults({ results, onViewCertificate, onExit }) {
  const passed = results.every((result) => result.score.passed);
  const message = results[0]?.score?.message;

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
            ? 'You cleared the certification exam. Your POSP certificate is ready.'
            : 'The material is still yours to revise, and you can sit the exam again when you are ready.'}
        </p>

        {/* The server's own sentence, when it sent one. It carries the score and
            the pass mark together, which is the one thing the cards below can't
            say on their own. */}
        {message && (
          <p className="mt-3 border-l-2 border-slate-200 pl-3 text-sm leading-relaxed text-slate-600">
            {message}
          </p>
        )}

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
          onClick={passed ? onViewCertificate : onExit}
          className="mt-8 flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {passed ? 'View Certificate' : 'Back to training'}
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </motion.div>
    </div>
  );
}

export default ExamResults;
