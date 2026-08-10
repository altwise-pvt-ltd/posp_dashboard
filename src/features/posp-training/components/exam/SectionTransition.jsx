import { motion } from 'framer-motion';
import { ArrowRight, CircleCheckBig, FileText } from 'lucide-react';
import { EXAM_SHELL } from './examShell';

/**
 * The breather between two sections: one is banked, the next is named, and
 * nothing is timed until the learner says go.
 */
function SectionTransition({ completedSection, nextSection, onStartNext }) {
  return (
    <div
      className={`${EXAM_SHELL} flex flex-col items-center justify-center overflow-y-auto border border-slate-200 bg-slate-50 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:p-8`}
    >
      <div className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl rounded-[2.5rem] border border-slate-100 bg-white p-10 text-center shadow-xl md:p-12"
      >
        <div className="relative mx-auto mb-8 h-28 w-28">
          <div className="absolute inset-0 animate-pulse rounded-full bg-green-400 opacity-30 blur-xl" />
          <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-white bg-linear-to-tr from-green-400 to-emerald-500 text-white shadow-lg">
            <CircleCheckBig size={54} strokeWidth={3} aria-hidden="true" />
          </div>
        </div>

        <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-800 md:text-4xl">
          Section Completed!
        </h2>
        <p className="mb-10 text-lg leading-relaxed text-slate-500">
          Awesome job! You have successfully completed the{' '}
          <strong className="text-slate-700">{completedSection.title}</strong> section. Take a deep
          breath before moving on.
        </p>

        <div className="mb-10 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left shadow-sm">
          <div>
            <div className="mb-1 text-xs font-bold tracking-wider text-slate-400 uppercase">Up Next</div>
            <div className="text-xl font-bold text-slate-800">{nextSection.title}</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white text-orange-500 shadow-sm">
            <FileText size={24} strokeWidth={2.5} aria-hidden="true" />
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartNext}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 py-4 text-lg font-bold text-white shadow-[0_8px_25px_rgba(249,115,22,0.3)] transition-all hover:from-orange-600 hover:to-amber-600 md:py-5"
        >
          <div className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-linear-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
          <span className="relative z-10 flex items-center gap-2">
            Start Next Section
            <ArrowRight
              size={22}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}

export default SectionTransition;
