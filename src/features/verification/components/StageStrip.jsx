import { Check, X } from "lucide-react";
import { STAGES } from "../model/verificationContent";

/**
 * The mobile counterpart to `StageTrail` — the same three stages as a horizontal
 * rail of markers with only the stage you are actually on spelled out
 * underneath.
 *
 * Labelling one stage instead of three is the whole saving. The other two are
 * either behind you or not your problem yet, and their descriptions were the
 * bulk of the height; the markers still show where you sit in the run of three,
 * which is all the trail was ever being read for on a phone.
 *
 * Reads off the same `STAGES` and the same `stageState` as the vertical
 * tracker, so the two can't drift apart.
 */
export default function StageStrip({ stageState }) {
  // The stage you are on is the first one not already behind you. Verified
  // pushes that to training, a rejection leaves it on the review stage as a
  // failure rather than advancing it.
  const activeIndex = STAGES.findIndex((_, index) => stageState(index) !== "done");
  const active = STAGES[activeIndex] ?? STAGES[STAGES.length - 1];
  const activeState = stageState(activeIndex);

  return (
    <div className="border-b border-slate-100 px-4 py-3.5 sm:hidden">
      <ol className="flex items-center gap-1.5" aria-label="Application progress">
        {STAGES.map((stage, index) => {
          const state = stageState(index);
          const done = state === "done";
          const current = state === "current";
          const failed = state === "failed";
          const isLast = index === STAGES.length - 1;

          return (
            <li
              key={stage.label}
              className={`flex items-center gap-1.5 ${isLast ? "" : "flex-1"}`}
            >
              {/* The markers are decoration; this is the stage as a screen
                  reader gets it, since the label below names only one of the
                  three. */}
              <span className="sr-only">
                {stage.label} —{" "}
                {done
                  ? "done"
                  : failed
                    ? "needs your attention"
                    : current
                      ? "in progress"
                      : "not started"}
              </span>

              <span
                aria-hidden="true"
                className={`grid size-5 shrink-0 place-items-center rounded-full ${
                  done
                    ? "bg-orange-500 text-white"
                    : failed
                      ? "bg-rose-500 text-white"
                      : current
                        ? "bg-orange-50 text-orange-600 ring-4 ring-orange-100"
                        : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : failed ? (
                  <X className="size-3" strokeWidth={3} />
                ) : (
                  <span
                    className={`size-1.5 rounded-full ${current ? "animate-pulse bg-orange-500 motion-reduce:animate-none" : "bg-slate-300"}`}
                  />
                )}
              </span>

              {/* The rail carries the same "everything up to here is done"
                  reading as the vertical tracker's connector. */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded-full ${done ? "bg-orange-500" : "bg-slate-200"}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-2.5 flex items-baseline justify-between gap-3">
        <p
          className={`text-[13px] font-bold leading-4 ${
            activeState === "failed" ? "text-rose-600" : "text-orange-600"
          }`}
        >
          {active.label}
        </p>
        <p className="shrink-0 text-[11px] font-semibold text-slate-400">
          Step {activeIndex + 1} of {STAGES.length}
        </p>
      </div>
    </div>
  );
}
