import { ChevronDown, ListFilter, Search, X } from 'lucide-react';
import { ALL } from '../lib/quotationStatus';

// Search filters the loaded rows; picking a status triggers a new request.

function QuotationFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  statuses = [],
  disabled = false,
}) {
  // Statuses come from what the server returned (see mergeStatuses); "All" sends no status param.
  const options = [{ code: ALL, label: 'All statuses' }, ...statuses];
  const filtered = status !== ALL;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="search" className="sm:max-w-sm sm:flex-1">
        <label htmlFor="quotation-search" className="sr-only">
          Search loaded quotations
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-hairline-cool bg-white px-3 py-2 transition-all duration-300 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-focus/20">
          <Search aria-hidden="true" className="size-4 shrink-0 text-ink-faint" />
          <input
            id="quotation-search"
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Reference, product or remark"
            className="w-full bg-transparent text-sm text-ink placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              className="shrink-0 rounded-md p-0.5 text-ink-faint transition-colors hover:bg-well-deep hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative sm:w-56 sm:shrink-0">
        <label htmlFor="quotation-status" className="sr-only">
          Filter by status
        </label>
        <ListFilter
          aria-hidden="true"
          className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${
            filtered ? 'text-orange-600' : 'text-ink-faint'
          }`}
        />
        <select
          id="quotation-status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          /* Disabled while a page loads so two status requests can't race. */
          disabled={disabled}
          className={`w-full cursor-pointer appearance-none rounded-xl border py-2 pl-9 pr-9 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-focus/20 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60 ${
            filtered
              ? 'border-orange-200 bg-orange-50 text-orange-700'
              : 'border-hairline-cool bg-white text-slate-700 hover:border-hairline-strong'
          }`}
        >
          {options.map((option) => (
            <option
              key={option.code}
              value={option.code}
              className="bg-white font-normal text-slate-700"
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
        />
      </div>
    </div>
  );
}

export default QuotationFilters;
