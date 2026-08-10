import { motion } from 'framer-motion';
import { ArrowRight, Clock, CircleCheckBig, TriangleAlert } from 'lucide-react';
import { EXAM_SHELL } from './examShell';

/**
 * Accent per instruction card, carried on the icon tile alone.
 *
 * One class string owns the tile's border, surface and icon colour together —
 * mixing an accent into a tile that already has a base `bg-*`/`border-*` leaves
 * two competing utilities on one element, where the winner is decided by
 * stylesheet order rather than by which one was written last.
 */
const ACCENT = {
  info: 'border-orange-100 bg-orange-50 text-orange-600',
  warning: 'border-red-100 bg-red-50 text-red-600',
};

/**
 * The gate in front of the exam: the rules on the right, the way in on the
 * left. Nothing is timed until the learner presses start.
 *
 * Framed like SectionTransition — the same shell, border and surface — because
 * both are static screens the exam pauses on, and the view should not resize
 * as the learner crosses between them.
 */
function ExamInstructions({ sections, sectionMinutes, passPercentage, onStart }) {
  const sectionNames = sections.map((section) => section.label).join(' & ');
  const firstSection = sections[0];

  const instructions = [
    {
      icon: Clock,
      title: 'Time Limit',
      description: `You have exactly ${sectionMinutes} minutes for each section (${sectionNames}).`,
      accent: ACCENT.info,
    },
    {
      icon: CircleCheckBig,
      title: 'Passing Criteria',
      description: `You must score at least ${passPercentage}% in each section individually to pass.`,
      accent: ACCENT.info,
    },
    {
      icon: TriangleAlert,
      title: 'Important Warning',
      description: 'Do not close or refresh this page. You cannot return once submitted.',
      accent: ACCENT.warning,
    },
  ];

  return (
    <div
      className={`${EXAM_SHELL} flex items-center justify-center overflow-y-auto border border-slate-200 bg-slate-50 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:p-12`}
    >
      <div className="grid w-full max-w-4xl grid-cols-1 items-center gap-8 md:grid-cols-5 md:gap-12">
        {/* Left: what this is, and the way in */}
        <div className="flex flex-col items-start text-left md:col-span-2">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-100/30 bg-orange-50/80 px-3 py-1 text-xs font-semibold text-orange-600">
            POSP Certification
          </span>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-800">
            Ready to Begin?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Please read the instruction cards carefully. Once you start, the timer will begin running
            and cannot be paused.
          </p>

          <button
            type="button"
            onClick={onStart}
            className="group mt-8 flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(234,88,12,0.15)] transition-all hover:bg-orange-700 hover:shadow-[0_6px_20px_rgba(234,88,12,0.25)] active:scale-[0.98]"
          >
            Start {firstSection.title} Exam
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
          <p className="mt-3 text-xs text-slate-400">Your progress will be saved automatically.</p>
        </div>

        {/* Right: the rules */}
        <div className="space-y-4 md:col-span-3">
          {instructions.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="group relative flex items-center gap-5 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border shadow-inner transition-transform duration-300 group-hover:scale-105 ${item.accent}`}
                >
                  <Icon className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
                </div>

                <div className="flex-1">
                  <h4 className="text-base font-semibold text-slate-800 transition-colors group-hover:text-slate-900">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ExamInstructions;
