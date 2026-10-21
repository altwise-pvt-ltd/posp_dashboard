import { hasEarningPoints } from '../lib/insurerResponse';

/** The agent's commission on one insurer response; nothing when it carries no earning data. */
function EarningStrip({ earning }) {
  if (!earning) return null;

  const { points, status, planName, note } = earning;
  if (points === null && !status && !note) return null;

  // Same rule as the chip on the comparison list, so the figure can't disagree with it.
  const showPoints = hasEarningPoints(earning);

  return (
    <div className="pt-4">
      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
        <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
          Your earning
          {planName && <span className="normal-case"> · {planName} plan</span>}
        </p>
        <p className="font-body-md text-body-md mt-1 text-on-surface">
          {showPoints ? `${points} points` : note || status}
        </p>
        {showPoints && note && (
          <p className="font-body-md text-body-md mt-0.5 text-on-surface-variant">{note}</p>
        )}
      </div>
    </div>
  );
}

export default EarningStrip;
