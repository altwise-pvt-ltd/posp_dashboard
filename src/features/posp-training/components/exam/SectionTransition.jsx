import { motion } from 'framer-motion';
import { ArrowRight, Check, FileText } from 'lucide-react';
import { EXAM_SHELL } from './examShell';

/**
 * The breather between two sections: one is banked, the next is named, and
 * nothing is timed until the learner says go.
 *
 * Held to the same square, flat language as the live exam — the learner
 * crosses straight from one to the other, and a celebration screen in a
 * different visual key reads as a different product. Green appears once, on
 * the completion mark, because that is the one thing here carrying a status
 * rather than an accent.
 */
function SectionTransition({ completedSection, nextSection, onStartNext }) {
  return (
    <div
      className={`${EXAM_SHELL} flex flex-col items-center justify-center overflow-y-auto border border-slate-200 bg-slate-50 p-6 md:p-8`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-lg border border-slate-200 bg-white p-8 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-10"
      >
        <div className="mb-6 flex h-11 w-11 items-center justify-center border border-emerald-200 bg-emerald-50 text-emerald-600">
          <Check size={22} strokeWidth={2.5} aria-hidden="true" />
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Section completed</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          <span className="font-medium text-slate-700">{completedSection.title}</span> is banked.
          Take a breath — the next section is not timed until you start it.
        </p>

        <div className="mt-8 flex items-center justify-between gap-4 border border-slate-200 bg-slate-50 p-4">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              Up Next
            </div>
            <div className="mt-1 truncate text-base font-semibold text-slate-900">
              {nextSection.title}
            </div>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary/25 bg-primary/8 text-primary">
            <FileText size={18} strokeWidth={2} aria-hidden="true" />
          </div>
        </div>

        <button
          type="button"
          onClick={onStartNext}
          className="mt-6 flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Start Next Section
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </motion.div>
    </div>
  );
}

export default SectionTransition;
