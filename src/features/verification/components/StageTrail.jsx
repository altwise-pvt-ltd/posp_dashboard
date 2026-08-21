import { Check, X } from "lucide-react";
import { STAGES } from "../model/verificationContent";

/**
 * One stage in the tracker. `state` is 'done' | 'current' | 'failed' |
 * 'upcoming', which drives the marker, the rail below it and the weight of the
 * label.
 */
function Stage({ stage, state, isLast }) {
  const done = state === "done";
  const current = state === "current";
  const failed = state === "failed";

  return (
    <li className="relative flex gap-3 pb-3.5 last:pb-0">
      {/* Rail down to the next marker. Skipped on the last stage so the line
          never runs past the end of the trail. */}
      {!isLast && (
        <span
          aria-hidden="true"
          className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5 ${
            done ? "bg-orange-500" : "bg-slate-200"
          }`}
        />
      )}

      <span
        className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full ${
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
          <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
        ) : failed ? (
          <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
        ) : (
          <span
            className={`size-1.5 rounded-full ${current ? "animate-pulse bg-orange-500 motion-reduce:animate-none" : "bg-slate-300"}`}
            aria-hidden="true"
          />
        )}
      </span>

      <div className="min-w-0 pt-0.5">
        <p
          className={`text-[13px] font-bold leading-4 ${
            failed
              ? "text-rose-600"
              : current
                ? "text-orange-600"
                : done
                  ? "text-slate-800"
                  : "text-slate-400"
          }`}
        >
          {stage.label}
        </p>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{stage.detail}</p>
      </div>
    </li>
  );
}

/**
 * The journey either side of this screen, run vertically.
 *
 * From `sm` up it is the only tracker on the page. It sits in the narrow
 * right-hand track of the status band, where a horizontal trail would wrap
 * "Application submitted" onto two lines and cost more height than the stacked
 * version it replaced. Below `sm` it is hidden and `StageStrip` takes over —
 * three stages with their descriptions is 160px of a phone screen to say which
 * of three boxes you are in.
 *
 * Only one of the two is in the accessibility tree at any width; the other is
 * `display: none`.
 */
export default function StageTrail({ stageState }) {
  return (
    <div className="hidden sm:block lg:border-l lg:border-slate-100 lg:pl-10">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        What happens next
      </h2>
      <ol className="mt-3.5">
        {STAGES.map((stage, index) => (
          <Stage
            key={stage.label}
            stage={stage}
            state={stageState(index)}
            isLast={index === STAGES.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}
