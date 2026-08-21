import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Files, Headset } from "lucide-react";
import DocumentRow from "./DocumentRow";
import { SUPPORT_EMAIL } from "../model/verificationContent";

/**
 * The checklist on a phone, where five identical rows saying "we're checking
 * this" cost 400px to communicate one bit.
 *
 * Split by whether the row is asking anything of the user. Anything flagged is
 * always open, above the fold of the section and under its own count, because
 * that is the reason the page is being read at all. Everything else — the whole
 * list while pending, the cleared remainder after a rejection — collapses to a
 * single summary row you can open if you want the detail.
 *
 * Nothing is hidden that the user has to act on, which is why this needs no
 * "expanded by default when rejected" state to get right: the flagged rows were
 * never in the collapsible half.
 *
 * Support closes the section here rather than sitting in a grid cell as it does
 * on desktop, and the address is a tap, not something to copy out by hand — the
 * subject line carries what the desktop copy asks them to include.
 */
export default function MobileDocuments({
  documents,
  rejected,
  verified,
  supportPrompt,
}) {
  const [open, setOpen] = useState(false);

  const flagged = documents.filter((entry) => entry.rejection);
  const rest = documents.filter((entry) => !entry.rejection);

  // Cleared covers both a full approval and the documents a rejection didn't
  // flag — those passed and shouldn't read as though they're still being
  // looked at.
  const restCleared = verified || rejected;

  const summary = rejected
    ? `${rest.length} other${rest.length === 1 ? "" : "s"} already cleared`
    : verified
      ? `All ${documents.length} documents cleared`
      : `${documents.length} documents with the reviewer`;

  return (
    <div className="sm:hidden">
      {flagged.length > 0 && (
        <>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-rose-500">
            {flagged.length} document{flagged.length === 1 ? "" : "s"} need
            {flagged.length === 1 ? "s" : ""} fixing
          </h2>
          <ul className="mt-2.5 grid gap-2.5">
            {flagged.map(({ item, rejection }) => (
              <DocumentRow key={item.id} item={item} rejection={rejection} />
            ))}
          </ul>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-3 text-left transition-colors duration-200 active:bg-slate-100 ${
          flagged.length > 0 ? "mt-2.5" : ""
        }`}
      >
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-lg ${
            restCleared
              ? "bg-emerald-50 text-emerald-600"
              : "bg-white text-slate-400 ring-1 ring-slate-200"
          }`}
        >
          {restCleared ? (
            <Check className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
          ) : (
            <Files className="size-3.5" strokeWidth={2} aria-hidden="true" />
          )}
        </span>

        <span className="min-w-0 flex-1 text-sm font-bold leading-4 text-slate-800">
          {summary}
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul className="mt-2.5 grid gap-2.5">
          {rest.map(({ item, cleared }) => (
            <DocumentRow key={item.id} item={item} cleared={cleared} />
          ))}
        </ul>
      )}

      <a
        href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("POSP verification help")}`}
        className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-3"
      >
        <Headset
          className="size-4 shrink-0 text-slate-400"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 text-xs leading-4 text-slate-500">
          {supportPrompt}{" "}
          <span className="font-semibold text-slate-700">Email support</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-slate-300" aria-hidden="true" />
      </a>
    </div>
  );
}
