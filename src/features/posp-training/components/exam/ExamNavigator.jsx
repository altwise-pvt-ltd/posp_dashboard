import { Check } from 'lucide-react';

/** The three things a tile in the map can be, spelled out under the grid. */
const LEGEND = [
  { label: 'Answered', swatch: 'bg-primary' },
  { label: 'Not answered', swatch: 'border border-slate-300 bg-white' },
  { label: 'Current', swatch: 'bg-white ring-1 ring-primary' },
];

/**
 * The side panel: how much of the section is done, a map to jump anywhere in
 * it, and the way to hand the section in.
 *
 * `answeredCount` arrives from the runner rather than being counted here a
 * second time — the header draws its progress hairline from the same number,
 * and two independent counts of the same thing are two things to keep in step.
 */
function ExamNavigator({
  sectionLabel,
  questions,
  answers,
  answeredCount,
  currentIndex,
  onJump,
  onSubmit,
}) {
  const remaining = questions.length - answeredCount;
  const answeredPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <aside className="relative z-20 flex w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:h-full lg:w-80 lg:border-t-0 lg:border-l">
      <div className="shrink-0 border-b border-slate-100 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-sm font-semibold tracking-tight text-slate-800">
            {sectionLabel} Progress
          </h3>
          <span className="shrink-0 font-mono text-xs font-semibold text-slate-400 tabular-nums">
            {answeredPercent}%
          </span>
        </div>

        <div className="mt-3 h-1 w-full bg-slate-100">
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${answeredPercent}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="border border-slate-200 bg-white p-3">
            <div className="font-mono text-xl leading-none font-semibold text-primary tabular-nums">
              {answeredCount}
            </div>
            <div className="mt-1.5 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              Answered
            </div>
          </div>
          <div className="border border-slate-200 bg-white p-3">
            <div className="font-mono text-xl leading-none font-semibold text-slate-400 tabular-nums">
              {remaining}
            </div>
            <div className="mt-1.5 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              Remaining
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 lg:overflow-y-auto">
        <p className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          Question Map
        </p>

        {/* Auto-fill below `lg`, a fixed five across at `lg` and up.
            The panel is only a 20rem side rail from `lg`; below it, it is a
            full-width block under the question — and a flat `grid-cols-5` there
            divided the whole window between five tiles, so a half-screen browser
            drew five ~180px squares. Auto-fill sizes the columns from the space
            actually available instead, keeping every tile around 2.75rem and
            letting the count grow with the width. The `lg:` override keeps the
            side rail's five-across map exactly as it was. */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5 lg:grid-cols-5">
          {questions.map((question, index) => {
            const isAttempted = answers[question.id] !== undefined;
            const isCurrent = index === currentIndex;

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => onJump(index)}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={`Question ${index + 1}${isAttempted ? ', answered' : ', not answered'}${
                  isCurrent ? ', current' : ''
                }`}
                className={`flex aspect-square w-full items-center justify-center border font-mono text-sm font-semibold tabular-nums transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none ${
                  isAttempted
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-primary/40 hover:text-primary'
                } ${isCurrent ? 'z-10 ring-1 ring-primary ring-offset-2 ring-offset-white' : ''}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className={`h-2.5 w-2.5 shrink-0 ${item.swatch}`} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-slate-100 bg-white p-4">
        {remaining > 0 && (
          <p className="mb-2.5 text-center text-[11px] text-slate-400">
            {remaining} question{remaining === 1 ? '' : 's'} still unanswered
          </p>
        )}

        <button
          type="button"
          onClick={onSubmit}
          className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-on-primary-fixed-variant focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Submit Section
          <Check size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

export default ExamNavigator;
