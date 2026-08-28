import { RefreshCw, TriangleAlert } from "lucide-react";

export default function StatusRefresh({ loading, error, onRefresh }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors duration-200 hover:border-orange-200 hover:text-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/20 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        <RefreshCw
          className={`size-3.5 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`}
          aria-hidden="true"
        />
        {loading ? "Checking…" : "Check again"}
      </button>

      {error && (
        <p
          role="status"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-600"
        >
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          Couldn't reach the server — showing your last known status.
        </p>
      )}
    </div>
  );
}
