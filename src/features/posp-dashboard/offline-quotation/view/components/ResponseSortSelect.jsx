import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { SORT_OPTIONS } from '../lib/insurerResponse';

/** Native sort dropdown for the insurer responses. */
function ResponseSortSelect({ value, onChange }) {
  return (
    <div className="relative w-full sm:w-48">
      <label htmlFor="insurer-response-sort" className="sr-only">
        Sort responses
      </label>
      <ArrowUpDown
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
      />
      <select
        id="insurer-response-sort"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer appearance-none rounded-xl border border-hairline-cool bg-white py-2 pl-9 pr-9 text-sm font-medium text-slate-700 transition-colors hover:border-hairline-strong focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-focus/20"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
      />
    </div>
  );
}

export default ResponseSortSelect;
