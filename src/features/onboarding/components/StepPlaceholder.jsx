import { ArrowRight } from "lucide-react";

/**
 * StepPlaceholder — temporary card shown for steps not yet implemented.
 * Props: step { label, title }, onNext
 *
 * Responsive: tighter padding on phones, roomier from `sm` up. Card caps at 520px.
 */
export default function StepPlaceholder({ step, onNext }) {
  return (
    <div className="flex w-full max-w-[310px] sm:max-w-[360px] lg:max-w-[400px] mx-auto lg:mx-0 flex-col items-center gap-6 rounded-3xl border border-slate-200/80 bg-white px-5 py-7 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.06)] sm:px-8 sm:py-12">
      <div>
        <div className="mb-1.5 text-[0.75rem] font-bold uppercase tracking-[0.06em] text-slate-400">
          {step.label}
        </div>
        <h2 className="m-0 font-headline-lg text-2xl font-extrabold text-slate-800">
          {step.title}
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
          This step is coming soon. Use the buttons below to navigate the flow.
        </p>
      </div>

      <div className="w-full">
        <button
          type="button"
          onClick={onNext}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#de7b3d_0%,#f97316_100%)] px-6 py-[13px] text-[0.9375rem] font-bold text-white shadow-[0_4px_16px_rgba(222,123,61,0.30)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(222,123,61,0.40)]"
        >
          Continue
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
