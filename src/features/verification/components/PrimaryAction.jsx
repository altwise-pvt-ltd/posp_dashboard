import { ArrowRight, PencilLine } from "lucide-react";

/**
 * The one thing the page asks of the user, rendered twice: full-width in the
 * mobile action bar, and content-width in the desktop action row. Same
 * component both times so the two can't diverge — a rejection has to send you
 * back into the wizard from either.
 */
export default function PrimaryAction({ rejected, verified, onClick, className = "" }) {
  return (
    <button
      type="button"
      disabled={!rejected && !verified}
      onClick={onClick}
      className={`group flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100 ${className}`}
    >
      {rejected ? (
        <>
          <PencilLine className="size-4" strokeWidth={2.25} aria-hidden="true" />
          Update my details
        </>
      ) : (
        <>
          Start POSP training
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:translate-x-0"
            aria-hidden="true"
          />
        </>
      )}
    </button>
  );
}
