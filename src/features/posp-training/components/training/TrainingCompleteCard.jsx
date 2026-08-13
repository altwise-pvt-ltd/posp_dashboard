import { ArrowRight, Check, Lock } from 'lucide-react';

/**
 * The "your hours are done, the exam is open" card.
 *
 * Deliberately the same shape as the verification-complete confirmation the
 * learner saw on the way in: tinted ring, tick, one orange CTA.
 */
function TrainingCompleteCard({ onStartExam }) {
  return (
    <div className="anim-fade mx-auto w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:p-12">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100">
        <Check className="size-8 text-orange-500" strokeWidth={3} aria-hidden="true" />
      </div>

      <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        Training complete
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
        You've finished the mandated 15 hours. The certification exam is now open — take it whenever
        you're ready.
      </p>

      <div className="mt-8 flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={onStartExam}
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] sm:text-base"
        >
          Start exam
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>

        <p className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="size-3.5" aria-hidden="true" />
          Secure examination environment
        </p>
      </div>
    </div>
  );
}

export default TrainingCompleteCard;
