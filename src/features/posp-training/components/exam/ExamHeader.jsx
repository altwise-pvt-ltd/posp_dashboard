import { Clock, GraduationCap, LogOut } from 'lucide-react';
import { formatMinutesSeconds } from '../../lib/formatDuration';
import { SECTION_SECONDS, URGENT_SECONDS } from './examTiming';

/**
 * The countdown ring, in numbers rather than magic values scattered through the
 * SVG: the box, the arc radius and the dash length all follow from the size and
 * the stroke, so the ring can be resized by changing one of them.
 */
const RING_SIZE = 34;
const RING_STROKE = 2.5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Which section, how far through it, how long is left, and the way out.
 *
 * The clock is shown twice over: as digits, which answer "how long exactly",
 * and as a ring draining anticlockwise, which answers "how much of the section
 * is gone" at a glance — the second reading is the one a learner takes without
 * stopping to read. Both turn red together under {@link URGENT_SECONDS}. The
 * ring is the one curve on the screen because it is an instrument rather than
 * decoration; everything else is square.
 *
 * The hairline along the bottom edge is the other progress story: questions
 * answered, not time spent. It sits on the bar rather than inside the question
 * column so it stays visible while the column scrolls.
 *
 * Deliberately a `div` and not a `header`: index.css carries a global
 * `header.sticky > div { height: 4.5rem !important }` for short viewports, and
 * a `header` here would let it inflate the 2px progress line into a band.
 */
function ExamHeader({
  sectionTitle,
  questionNumber,
  questionCount,
  answeredCount,
  secondsLeft,
  onSubmit,
}) {
  const isUrgent = secondsLeft <= URGENT_SECONDS;
  // Clamped because the ring is geometry: a fraction outside 0–1 would draw an
  // arc longer than the circle it sits on.
  const timeLeftFraction = Math.min(1, Math.max(0, secondsLeft / SECTION_SECONDS));
  const answeredPercent = Math.round((answeredCount / questionCount) * 100);

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-2.5">
        {/* Which paper this is, and where in it */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-primary/25 bg-primary/8 text-primary">
            <GraduationCap size={18} strokeWidth={2} aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              POSP Certification
            </p>
            <div className="flex items-baseline gap-2">
              <h2 className="truncate text-base font-bold tracking-tight text-slate-800">
                {sectionTitle}
              </h2>
              <span className="shrink-0 border border-slate-200 bg-slate-50 px-1.5 font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                {questionNumber}/{questionCount}
              </span>
            </div>
          </div>
        </div>

        {/* Time, and the way out */}
        <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
          <div
            role="timer"
            aria-label={`Time remaining: ${formatMinutesSeconds(secondsLeft)}`}
            className={`flex items-center gap-2.5 border px-3 py-1.5 transition-colors ${
              isUrgent ? 'border-error/40 bg-error/5' : 'border-slate-200 bg-white'
            }`}
          >
            <span
              className="relative flex shrink-0 items-center justify-center"
              style={{ width: RING_SIZE, height: RING_SIZE }}
            >
              <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" aria-hidden="true">
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  className="stroke-slate-200"
                />
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  strokeDasharray={RING_LENGTH}
                  strokeDashoffset={RING_LENGTH * (1 - timeLeftFraction)}
                  // One second of easing per one second of clock, so the arc
                  // creeps rather than stepping once a second.
                  className={`transition-[stroke-dashoffset] duration-1000 ease-linear ${
                    isUrgent ? 'stroke-error' : 'stroke-primary'
                  }`}
                />
              </svg>
              <Clock
                size={13}
                strokeWidth={2}
                aria-hidden="true"
                className={`absolute ${isUrgent ? 'text-error' : 'text-slate-400'}`}
              />
            </span>

            <span className="leading-none">
              <span
                className={`block font-mono text-base font-semibold tabular-nums ${
                  isUrgent ? 'text-error' : 'text-slate-800'
                }`}
              >
                {formatMinutesSeconds(secondsLeft)}
              </span>
              <span className="mt-1 block text-[9px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                Time left
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase transition-colors hover:border-error/40 hover:text-error focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:outline-none md:px-4"
          >
            <LogOut size={14} strokeWidth={2} aria-hidden="true" />
            End Section
          </button>
        </div>
      </div>

      {/* Answered-so-far hairline */}
      <div className="h-0.5 w-full bg-slate-100" aria-hidden="true">
        <div
          className="h-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${answeredPercent}%` }}
        />
      </div>
    </div>
  );
}

export default ExamHeader;
