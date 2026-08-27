import { ArrowRight, BadgeCheck, Check, Loader2, Lock, TriangleAlert } from 'lucide-react';

/**
 * The "your hours are done, the exam is open" panel.
 *
 * Shaped as a rail card rather than a full-page one, because a rail card is what
 * it replaces: when the clock runs out the syllabus stays exactly where it is
 * and only the countdown beside it is swapped for this.
 *
 * It used to take over the whole page. That read "complete" as "finished with
 * you" — a POSP who enrolled, went away for a week and came back found the
 * material they had paid the hours for simply gone, at the one moment they most
 * wanted to revise it, with an exam still to sit. The hours running out ends the
 * countdown, not the access.
 *
 * Deliberately the same frame as `TrainingProgressRail`: same radius, border and
 * shadow, same label-plus-icon head, same slate note at the foot. The swap
 * should read as the panel changing its mind, not as the page rearranging
 * itself.
 *
 * The button is not a pure navigation any more. Pressing it closes the mandated
 * period with the LMS (`POST /lms/complete-training`) before the portal opens,
 * so it carries the same busy and failed states the start card does — a press
 * that reaches the server and comes back refused has to say so here, rather than
 * dropping the POSP into an exam their record has not been cleared for.
 */
function TrainingCompleteCard({ requiredHours, starting = false, error = null, onStartExam }) {
  return (
    <div className="anim-fade rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          Hours complete
        </span>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100">
          <Check className="size-4" strokeWidth={3} aria-hidden="true" />
        </span>
      </div>

      <p className="mt-5 text-base font-extrabold leading-6 tracking-tight text-slate-900">
        {/* `requiredHours` rather than a hardcoded 15 — a POSP on "Both" sits 30,
            and being told they finished the wrong number is a small thing that
            reads as the wrong programme. */}
        Your {requiredHours} hours are served
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        The certification exam is open. Sit it whenever you're ready.
      </p>

      <button
        type="button"
        disabled={starting}
        aria-busy={starting}
        onClick={onStartExam}
        className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100"
      >
        {starting ? (
          <>
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {/* Names the wait honestly: the pause is the LMS recording the
                hours, not the exam loading. */}
            Recording your hours…
          </>
        ) : (
          <>
            {error ? 'Try again' : 'Start exam'}
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {/* One slot, two readings — the reassurance the press usually deserves,
          or the reason it didn't work. */}
      {error ? (
        <p
          role="status"
          className="mt-3 inline-flex items-start gap-1.5 text-[0.6875rem] leading-4 text-rose-600"
        >
          <TriangleAlert className="mt-px size-3 shrink-0" aria-hidden="true" />
          {error.message}
        </p>
      ) : (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.6875rem] text-slate-400">
          <Lock className="size-3" aria-hidden="true" />
          Secure examination environment
        </p>
      )}

      {/* The reassurance the old full-page card could not give, because it was
          busy hiding the thing it would have been reassuring about. */}
      <div className="mt-6 flex gap-3 rounded-xl bg-slate-50 p-3.5">
        <BadgeCheck
          className="mt-0.5 size-4 shrink-0 text-orange-500"
          strokeWidth={2.25}
          aria-hidden="true"
        />
        <p className="text-xs leading-5 text-slate-500">
          Your study material stays available. Revise anything you need before you sit the exam.
        </p>
      </div>
    </div>
  );
}

export default TrainingCompleteCard;