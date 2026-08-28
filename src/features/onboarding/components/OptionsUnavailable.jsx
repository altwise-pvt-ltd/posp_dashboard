import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * What a selector shows when its options couldn't be loaded.
 *
 * Sized and bordered to sit in the space the options themselves would have
 * taken, so the form doesn't collapse and re-expand around a retry. Shared by
 * the three steps that read a masters list, both to keep the wording identical
 * and because "the list failed" is a state each of them would otherwise have
 * spelled out slightly differently.
 *
 * @param {string} label   what failed to load, lowercase — "business types"
 * @param {() => void} onRetry
 */
export default function OptionsUnavailable({ label, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-3">
      <p className="flex items-start gap-1.5 text-xs sm:text-sm font-medium text-red-600" role="alert">
        <AlertCircle size={14} className="mt-px shrink-0" />
        {/* Names the consequence, not just the failure — a user who reads only
            the first line should still know why the step is stuck. */}
        Couldn't load {label}. You'll need these to continue.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors duration-200 hover:border-red-300 hover:bg-red-50 active:scale-[0.98]"
      >
        <RotateCcw size={12} strokeWidth={2.5} />
        Try again
      </button>
    </div>
  );
}
