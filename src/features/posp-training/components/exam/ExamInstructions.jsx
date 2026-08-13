import { motion } from 'framer-motion';
import { ArrowRight, Clock, CircleCheckBig, ScrollText, TriangleAlert } from 'lucide-react';
import { EXAM_SHELL } from './examShell';

/**
 * Accent per highlighted rule: one string for the row's tinted surface, one for
 * the icon tile that sits on it.
 *
 * Each string owns its element's border, surface and colour together — mixing
 * an accent into an element that already has a base `bg-*`/`border-*` leaves two
 * competing utilities on one element, where the winner is decided by stylesheet
 * order rather than by which one was written last.
 */
const ACCENT = {
  info: {
    row: 'border-orange-100 bg-orange-50/60',
    tile: 'border-orange-100 bg-white text-orange-600',
  },
  warning: {
    row: 'border-red-100 bg-red-50/60',
    tile: 'border-red-100 bg-white text-red-600',
  },
};

/**
 * The gate in front of the exam: one rules panel on the right, the way in on
 * the left. Nothing is timed until the learner presses start.
 *
 * The rules live in a single container rather than three floating cards — they
 * are one set of terms being agreed to, and separate cards read as three
 * unrelated notices. The brief sets the shape of the paper; the three points
 * below it are the ones a learner cannot afford to skim, so each is highlighted
 * on its own tinted row.
 *
 * Framed like SectionTransition — the same shell, border and surface — because
 * both are static screens the exam pauses on, and the view should not resize
 * as the learner crosses between them.
 */
function ExamInstructions({ sections, sectionMinutes, passPercentage, onStart }) {
  const sectionNames = sections.map((section) => section.label).join(' & ');
  const firstSection = sections[0];
  const totalMinutes = sectionMinutes * sections.length;

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

        {/* Right: the rules, as one set of terms */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:col-span-3 md:p-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600">
              <ScrollText className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-slate-900">
                Exam Guidelines
              </h3>
              <p className="text-xs text-slate-400">Please read before you start</p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-500">
            The certification exam is sat in{' '}
            {sections.length === 1 ? 'a single section' : `${sections.length} sections`} —{' '}
            <span className="font-medium text-slate-700">{sectionNames}</span> — and takes about{' '}
            <span className="font-medium text-slate-700">{totalMinutes} minutes</span> in total. Each
            section is a set of multiple-choice questions, scored on its own, and you may move freely
            between questions until you submit that section.
          </p>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              Key Points
            </div>

            <ul className="mt-3 space-y-3">
              {instructions.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.li
                    key={item.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.08, duration: 0.3 }}
                    className={`flex items-start gap-4 rounded-xl border p-4 ${item.accent.row}`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${item.accent.tile}`}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={2} aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ExamInstructions;
