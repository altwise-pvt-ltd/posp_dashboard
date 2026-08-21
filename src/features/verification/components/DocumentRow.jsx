import { Check, X } from "lucide-react";

/**
 * One document in the checklist. Shared by the mobile list and the desktop grid
 * so a change to how a flagged document reads lands in both at once.
 *
 * Type steps down a notch from `sm` up: 14/12px is the floor for body text on a
 * phone, while the desktop grid was tuned at 13/11px to fit three columns
 * without wrapping. Same rows, sized for the device holding them.
 */
export default function DocumentRow({ item, rejection, cleared }) {
  const { icon: Icon, label, detail } = item;

  return (
    <li
      className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 sm:py-2.5 ${
        rejection
          ? "border-rose-200 bg-rose-50/50"
          : "border-slate-200/70 bg-slate-50/70"
      }`}
    >
      <span
        className={`mt-px grid size-7 shrink-0 place-items-center rounded-lg ${
          rejection
            ? "bg-rose-100 text-rose-600"
            : cleared
              ? "bg-emerald-50 text-emerald-600"
              : "bg-white text-slate-400 ring-1 ring-slate-200"
        }`}
      >
        {rejection ? (
          <X className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
        ) : cleared ? (
          <Check className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
        ) : (
          <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0">
        <p
          className={`text-sm font-bold leading-4 sm:text-[13px] ${
            rejection ? "text-rose-700" : "text-slate-800"
          }`}
        >
          {label}
        </p>
        {/* The reason replaces the description — what a document is normally
            checked for stops mattering once you're being told why yours
            failed. */}
        <p
          className={`mt-1 text-xs leading-4 sm:mt-0.5 sm:text-[11px] ${
            rejection ? "text-rose-600" : "text-slate-500"
          }`}
        >
          {rejection ? rejection.reason : detail}
        </p>
      </div>
    </li>
  );
}
