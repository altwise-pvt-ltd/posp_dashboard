import { Clock } from 'lucide-react';
import { formatMinutesSeconds } from '../../lib/formatDuration';

/** Below this the clock turns red and pulses — the last five minutes. */
const URGENT_SECONDS = 5 * 60;

/** Which section, how far through it, how long is left, and the way out. */
function ExamHeader({ sectionTitle, questionNumber, questionCount, secondsLeft, onSubmit }) {
  const isUrgent = secondsLeft <= URGENT_SECONDS;

  return (
    <div className="sticky top-0 z-20 flex flex-col items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:gap-0 md:px-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 md:w-auto md:justify-start">
        <h2 className="text-base font-bold text-slate-800 md:text-lg">{sectionTitle} Exam</h2>
        <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold whitespace-nowrap text-orange-600 md:py-1.5">
          Q {questionNumber} of {questionCount}
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold transition-colors md:text-base ${
            isUrgent
              ? 'animate-pulse border-red-300 bg-red-50 text-red-600'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          <Clock
            size={16}
            strokeWidth={2.5}
            aria-hidden="true"
            className={isUrgent ? '' : 'text-slate-400'}
          />
          {formatMinutesSeconds(secondsLeft)}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase transition-colors hover:bg-red-50 hover:text-red-600 md:text-sm"
        >
          End Test Early
        </button>
      </div>
    </div>
  );
}

export default ExamHeader;
