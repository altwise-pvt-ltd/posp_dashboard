import { hasEarningPoints } from '../lib/insurerResponse';

function EarningStrip({ earning }) {
  if (!earning) return null;

  const { points, status, planName, note } = earning;
  if (points === null && !status && !note) return null;

  const showPoints = hasEarningPoints(earning);

  return (
    <div className="pt-4">
      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
        <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
          Your earning
          {planName && <span className="normal-case"> · {planName} plan</span>}
        </p>
        <p className="font-body-md text-body-md mt-1 text-on-surface">
          {showPoints ? `${points} points` : note || 'Earning unavailable'}
        </p>
        {showPoints && note && (
          <p className="font-body-md text-body-md mt-0.5 text-on-surface-variant">{note}</p>
        )}
      </div>
    </div>
  );
}

export default EarningStrip;
