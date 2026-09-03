import { Check } from 'lucide-react';

const DOT =
  'flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-semibold transition-colors duration-200';

function QuoteWizardStepper({ steps, current, furthest, onJump }) {
  const total = steps.length;
  const percent = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="mb-gutter">
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-headline-md text-headline-md min-w-0 truncate text-on-surface">
            {steps[current]?.name}
          </p>
          <p className="text-[0.6875rem] font-medium whitespace-nowrap text-slate-400">
            Step {current + 1} of {total}
          </p>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ol className="hidden gap-1 overflow-x-auto pb-1 sm:flex sm:items-center">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const reachable = index <= furthest;

          return (
            <li key={index} className="flex min-w-0 flex-1 items-center gap-1">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onJump(index)}
                aria-current={active ? 'step' : undefined}
                className={`flex min-w-0 items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors duration-200 ${
                  reachable ? 'cursor-pointer hover:bg-orange-50' : 'cursor-default'
                }`}
              >
                <span
                  className={`${DOT} ${
                    done
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : active
                        ? 'border-orange-500 bg-white text-orange-600 ring-4 ring-orange-500/15'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {done ? <Check size={12} strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={`truncate text-[0.8125rem] ${
                    active
                      ? 'font-semibold text-slate-900'
                      : done
                        ? 'font-medium text-slate-600'
                        : 'text-slate-400'
                  }`}
                >
                  {step.name}
                </span>
              </button>

              {index < total - 1 && (
                <span
                  className={`h-px min-w-4 flex-1 transition-colors duration-300 ${
                    done ? 'bg-orange-300' : 'bg-slate-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default QuoteWizardStepper;
