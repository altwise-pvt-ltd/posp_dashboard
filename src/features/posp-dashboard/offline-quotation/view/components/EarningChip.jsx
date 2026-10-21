import { useId } from 'react';
import { Coins, Info } from 'lucide-react';
import { hasEarningPoints } from '../lib/insurerResponse';

const CHIP =
  'inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1';

/** The agent's earning on one response, or a note explaining why there is none. */
function EarningChip({ earning }) {
  const tooltipId = useId();
  if (!earning) return null;

  const { points, planName, note } = earning;

  if (hasEarningPoints(earning)) {
    return (
      <span
        className={`${CHIP} self-start bg-emerald-50 text-emerald-700 ring-emerald-200 md:self-auto`}
      >
        <Coins aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="truncate">
          Earn {points} pts{planName && ` · ${planName}`}
        </span>
      </span>
    );
  }

  const chip = (
    <>
      <Info aria-hidden="true" className="size-3.5 shrink-0" />
      Earning unavailable
    </>
  );

  if (!note) {
    return (
      <span className={`${CHIP} self-start bg-well text-ink-subtle ring-hairline md:self-auto`}>
        {chip}
      </span>
    );
  }

  return (
    <span className="group relative inline-flex self-start md:self-auto">
      <button
        type="button"
        aria-describedby={tooltipId}
        className={`${CHIP} cursor-help bg-well text-ink-subtle ring-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40`}
      >
        {chip}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 max-w-[80vw] rounded-lg bg-ink px-3 py-2 text-xs leading-snug text-white shadow-lg group-focus-within:block group-hover:block"
      >
        {note}
      </span>
    </span>
  );
}

export default EarningChip;
