import { BadgeCheck, Clock } from 'lucide-react';
import { splitDuration } from '../../lib/formatDuration';

/**
 * The sticky rail beside the syllabus: how long is left, how far in the learner
 * is, and what happens when the clock runs out.
 *
 * The countdown is set in the theme's mono face with tabular figures, so the
 * digits hold their columns as they tick without needing a box drawn around
 * each one to stop the layout shifting.
 */
function TrainingProgressRail({ secondsLeft, totalSeconds, onSkip, skipping }) {
  const { hours, minutes, seconds } = splitDuration(secondsLeft);
  const elapsed = totalSeconds - secondsLeft;

  /* Guarded: a plan whose `requiredHours` never arrived puts a zero on the
     bottom of that division and "NaN%" on the screen. Zero is the honest
     reading — nothing can be shown as served against a period we don't know. */
  const percent =
    totalSeconds > 0 ? Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100)) : 0;

  /* The mandated period as the POSP was told it — 15 hours for one line, 30 for
     both. Read off the seconds already passed in rather than hardcoded, which is
     what the note below used to do: it promised every POSP 15 hours, including
     the ones sitting 30. */
  const totalHours = Math.round(totalSeconds / 3600);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          Time remaining
        </span>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
          <Clock className="size-4" strokeWidth={2.25} aria-hidden="true" />
        </span>
      </div>

      <p className="mt-5 font-mono text-4xl font-medium leading-none tracking-tight text-slate-900 tabular-nums">
        {hours}
        <span className="text-slate-300">:</span>
        {minutes}
        <span className="text-slate-300">:</span>
        {seconds}
      </p>
      <p className="mt-2.5 text-xs text-slate-400">hours · minutes · seconds</p>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Progress
          </span>
          <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
            {percent.toFixed(1)}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Number(percent.toFixed(1))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Training progress"
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className="h-full rounded-full bg-orange-500 transition-[width] duration-1000 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3 rounded-xl bg-slate-50 p-3.5">
        <BadgeCheck className="mt-0.5 size-4 shrink-0 text-orange-500" strokeWidth={2.25} aria-hidden="true" />
        <p className="text-xs leading-5 text-slate-500">
          Your certification exam unlocks the moment the {totalHours} hours are complete. The study
          material stays available throughout — and after.
        </p>
      </div>

      {/* A test affordance, styled like one — as a full-width bordered button it
          competed with the real primary action.

          It sends the outstanding hours to the LMS before it zeroes the clock,
          so it is a real request and can be in flight: disabled while it is, or
          a second press double-counts the same hours. */}
      <button
        type="button"
        onClick={onSkip}
        disabled={skipping}
        className="mt-4 w-full rounded-lg py-2 text-xs font-semibold text-slate-400 transition-colors hover:text-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/25 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300"
      >
        {skipping ? (
          'Skipping…'
        ) : (
          <>
            Skip timer <span className="font-normal">(test only)</span>
          </>
        )}
      </button>
    </div>
  );
}

export default TrainingProgressRail;
