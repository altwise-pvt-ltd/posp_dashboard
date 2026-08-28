import { motion } from 'framer-motion';
import { ArrowRight, Clock, CircleCheckBig, ScrollText, TriangleAlert } from 'lucide-react';

/**
 * Accent per highlighted rule — the icon carries it, and nothing else.
 *
 * The points sit directly on the panel, so a tinted surface behind each one
 * would be a card inside a card. Colouring the icon alone still separates the
 * warning from the two neutral rules without drawing a second frame.
 */
const ACCENT = {
  info: 'text-orange-500',
  warning: 'text-red-500',
};

/**
 * The gate in front of the exam: one rules panel on the right, the way in on
 * the left. Nothing is timed until the learner presses start.
 *
 * The rules live in a single container rather than three floating cards — they
 * are one set of terms being agreed to, and separate cards read as three
 * unrelated notices. The brief sets the shape of the paper; the three points
 * below it are the ones a learner cannot afford to skim, so they are listed
 * plainly on the panel, split by hairlines rather than boxed.
 *
 * The one exam screen that is *not* full-bleed — see `isFullBleed` in
 * ExamPortal. It keeps the app's bar and footer, so it fills the room they leave
 * (`flex-1` against the layout's column) rather than claiming the viewport, and
 * it carries no border or surface of its own: on the page's own background,
 * those would draw a box around a screen that is simply the page.
 */
function ExamInstructions({ sections, sectionMinutes, onStart }) {
  const sectionNames = sections.map((section) => section.label).join(' & ');
  const firstSection = sections[0];
  const totalMinutes = sectionMinutes * sections.length;
  const isSingleSection = sections.length === 1;

  /* Written twice rather than phrased to cover both cases. A single-section
     sitting read "each section (Life)" and "in each section individually" —
     wording that only makes sense next to a second section the learner cannot
     see, and that reads as a rule they have missed rather than one they have
     understood. */
  const instructions = [
    {
      icon: Clock,
      title: 'Time Limit',
      description: isSingleSection
        ? `You get ${sectionMinutes} minutes to complete the exam. The timer starts as soon as you begin and cannot be paused.`
        : `You get ${sectionMinutes} minutes for each section. The timer starts when a section opens and cannot be paused.`,
      accent: ACCENT.info,
    },
    /* No pass mark quoted. It used to say "at least 50%", from a constant in
       this app — a second copy of a figure the examiner owns, free to disagree
       with the real one and printed at the one moment a learner would take it as
       a promise. The grading reply states the score and the mark it was measured
       against together, and that is where the number belongs. */
    {
      icon: CircleCheckBig,
      title: 'Scoring',
      description:
        'Your paper is graded by the examiner as soon as you submit. Your score, and the mark you needed, are shown with your result.',
      accent: ACCENT.info,
    },
    {
      icon: TriangleAlert,
      title: 'Do Not Close or Refresh',
      description: isSingleSection
        ? 'Closing or refreshing this page ends your attempt, and you will have to start the exam again. Once you submit, your answers cannot be changed.'
        : 'Closing or refreshing this page ends your attempt, and you will have to start the exam again. Once a section is submitted, it cannot be reopened.',
      accent: ACCENT.warning,
    },
  ];

  return (
    <div className="relative flex w-full flex-1 items-center justify-center p-4 py-10 md:p-12">
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
            Please read the guidelines carefully before you continue. The timer starts the moment you
            begin, and it cannot be paused.
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
          {/* Not "your progress is saved automatically" — it isn't. The attempt
              lives in `ExamPortal`'s state, so the honest thing to ask for is
              the time and the open tab the sitting actually needs. */}
          <p className="mt-3 text-xs text-slate-400">
            Set aside about {totalMinutes} minutes and stay on this page until you finish.
          </p>
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
            {isSingleSection ? (
              <>
                Your certification exam has one section —{' '}
                <span className="font-medium text-slate-700">{sectionNames}</span> — with a time
                limit of{' '}
                <span className="font-medium text-slate-700">{sectionMinutes} minutes</span>. Every
                question is multiple choice. You can move between questions and change your answers
                as often as you like, until you submit.
              </>
            ) : (
              <>
                Your certification exam has{' '}
                <span className="font-medium text-slate-700">{sections.length} sections</span> —{' '}
                {sectionNames} — and takes about{' '}
                <span className="font-medium text-slate-700">{totalMinutes} minutes</span> in total.
                Every question is multiple choice, and each section is scored on its own. You can
                move between questions and change your answers until you submit that section.
              </>
            )}
          </p>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              Key Points
            </div>

            <ul className="mt-2 divide-y divide-slate-100">
              {instructions.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.li
                    key={item.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.08, duration: 0.3 }}
                    className="flex items-start gap-3 py-4 first:pt-3 last:pb-0"
                  >
                    {/* Optically aligned to the title's cap height rather than
                        to the line box, which sits the icon a touch low. */}
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${item.accent}`}
                      strokeWidth={2}
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
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
