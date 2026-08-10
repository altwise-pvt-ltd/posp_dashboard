import { motion } from 'framer-motion';
import { ArrowRight, CircleCheckBig, Clock, TriangleAlert } from 'lucide-react';
import { EXAM_SHELL } from './examShell';

const TONES = {
  orange: {
    card: 'border-orange-100 shadow-[0_8px_30px_rgba(249,115,22,0.04)] hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)]',
    plate: 'bg-orange-100 text-orange-500',
    title: 'text-slate-800',
  },
  red: {
    card: 'border-red-100 shadow-[0_8px_30px_rgba(239,68,68,0.04)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]',
    plate: 'bg-red-100 text-red-500',
    title: 'text-red-600',
  },
};

/** One rule of the exam. `red` is reserved for the one that costs the learner. */
function InstructionCard({ icon: Icon, tone = 'orange', title, children }) {
  const { card, plate, title: titleColor } = TONES[tone];

  return (
    <div
      className={`group flex flex-col items-center gap-3 rounded-2xl border bg-white/70 p-5 text-center backdrop-blur-md transition-all duration-300 hover:bg-white ${card}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${plate}`}
      >
        <Icon size={20} strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div>
        <h4 className={`mb-1 text-base font-bold ${titleColor}`}>{title}</h4>
        <p className="text-sm leading-relaxed text-slate-600">{children}</p>
      </div>
    </div>
  );
}

/**
 * The exam's front door: what the learner is about to sit, and the two rules
 * that decide the outcome, before anything is timed.
 *
 * Everything that could go stale is derived from the sections and limits it is
 * handed — the copy names the sections rather than hardcoding "General & Life".
 */
function ExamInstructions({ sections, sectionMinutes, passPercentage, onStart }) {
  const sectionNames = sections.map((section) => section.label).join(' & ');
  const firstSection = sections[0];

  return (
    <div
      className={`${EXAM_SHELL} flex flex-col items-center justify-center overflow-y-auto border border-orange-100/50 bg-linear-to-br from-white via-orange-50/30 to-amber-50/50 p-4 shadow-[inset_0_0_100px_rgba(255,255,255,0.5)] md:p-6`}
    >
      {/* Soft colour behind the card — decorative, never in the way of a click */}
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden rounded-3xl">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-orange-200/20 mix-blend-multiply blur-[80px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-amber-200/20 mix-blend-multiply blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
          className="mb-6 flex flex-col items-center"
        >
          <div className="group relative mt-2 mb-4">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-orange-400 opacity-20 blur-xl transition-opacity duration-700 group-hover:opacity-40" />
            <div className="absolute inset-[-8px] animate-[spin_15s_linear_infinite] rounded-[1.5rem] border-2 border-dashed border-orange-200" />

            <div className="relative z-10 flex h-20 w-20 rotate-3 items-center justify-center rounded-2xl border-4 border-white bg-linear-to-br from-orange-50 to-amber-100 shadow-[0_0_30px_rgba(249,115,22,0.15)] backdrop-blur-sm transition-transform duration-500 group-hover:rotate-0">
              {/* Hand-rolled rather than the lucide FileText: the stroke is a
                  gradient, which needs its own <defs> inside the SVG. */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#exam-doc-gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="drop-shadow-sm"
              >
                <defs>
                  <linearGradient id="exam-doc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>

          <h2 className="mb-2 bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-center text-3xl font-black tracking-tight text-transparent drop-shadow-sm md:text-4xl">
            Exam Instructions
          </h2>
          <p className="text-center text-base font-medium text-slate-500">
            Please read carefully before starting the POSP Certification Exam
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          <InstructionCard icon={Clock} title="Time Limit">
            You have exactly <strong className="text-orange-600">{sectionMinutes} minutes</strong> for
            each section ({sectionNames}).
          </InstructionCard>

          <InstructionCard icon={CircleCheckBig} title="Passing Criteria">
            You must score at least <strong className="text-orange-600">{passPercentage}%</strong> in
            each section individually to pass.
          </InstructionCard>

          <InstructionCard icon={TriangleAlert} tone="red" title="Important Warning">
            <strong className="text-slate-800">Do not close or refresh this page.</strong> You cannot
            return once submitted.
          </InstructionCard>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex justify-center"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="group relative w-full max-w-lg overflow-hidden rounded-xl bg-linear-to-r from-orange-500 via-amber-500 to-orange-600 py-4 text-lg font-bold text-white shadow-[0_10px_40px_rgba(249,115,22,0.3)] transition-all duration-300 hover:shadow-[0_15px_50px_rgba(249,115,22,0.4)]"
          >
            <div className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />

            <span className="relative flex items-center justify-center gap-3 drop-shadow-md">
              Start {firstSection.title} Exam
              <ArrowRight
                size={20}
                strokeWidth={2.5}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default ExamInstructions;
