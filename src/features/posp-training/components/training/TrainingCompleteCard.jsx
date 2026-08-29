import {
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  Lock,
  TriangleAlert,
} from "lucide-react";

function TrainingCompleteCard({
  requiredHours,
  starting = false,
  error = null,
  blockedReason = null,
  onStartExam,
}) {
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
        {blockedReason
          ? "Your hours are served, but the exam is not open to you right now."
          : "The certification exam is open. Sit it whenever you're ready."}
      </p>

      <button
        type="button"
        disabled={starting || Boolean(blockedReason)}
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
            {/* No arrow on a refusal — it points at a door that won't open. */}
            {blockedReason ? (
              <>
                <Lock className="size-4" aria-hidden="true" />
                Exam unavailable
              </>
            ) : (
              <>
                {error ? "Try again" : "Start exam"}
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </>
            )}
          </>
        )}
      </button>

      {blockedReason ? (
        <p
          role="status"
          className="mt-3 inline-flex items-start gap-1.5 text-[0.6875rem] leading-4 text-amber-700"
        >
          <TriangleAlert className="mt-px size-3 shrink-0" aria-hidden="true" />
          {blockedReason}
        </p>
      ) : error ? (
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
          Your study material stays available. Revise anything you need before
          you sit the exam.
        </p>
      </div>
    </div>
  );
}

export default TrainingCompleteCard;
