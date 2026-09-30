import { ChevronDown, ListFilter, Search, X } from 'lucide-react';
import { ALL } from '../lib/quotationStatus';

/**
 * The toolbar: one search field and the status filter.
 *
 * The two controls do not act in the same place, and that is deliberate rather
 * than accidental — see the note at the top of `useQuotationList`. Picking a
 * status is a request to the server; the field filters the rows already loaded.
 *
 * The options carry no counts. They used to, when the whole list was in memory
 * and a tally was honest. Against a paged endpoint the only number available is
 * "how many are on the page in hand", which is not what an option labelled
 * "Draft" would be read as claiming. The real total lives under the list, where
 * it can say what it is counting.
 *
 * Status is a dropdown rather than a row of chips: the list is learned (see
 * `mergeStatuses`) and only grows, and a chip per status outgrew the toolbar —
 * it squeezed the search field down to its first two letters. A dropdown stays
 * one control wide however many states the server turns out to have.
 *
 * Both controls are built here rather than reusing `shared/components/Input` or
 * `Select`: those carry a form row's label block and bottom margin. A toolbar
 * needs controlled values and no margin. The select is still native for the same
 * reasons `Select` is — platform picker on mobile, keyboard and screen-reader
 * behaviour for free.
 */

function QuotationFilters({
  query,
  onQueryChange,
  status,
  onStatusChange,
  statuses = [],
  disabled = false,
}) {
  /* Built from what the server has actually been seen to return rather than a
     list in the app — see `mergeStatuses`. "All" is the app's own, and is the
     one option that sends no `status` parameter. */
  const options = [{ code: ALL, label: 'All statuses' }, ...statuses];
  const filtered = status !== ALL;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* `role="search"` on the wrapper, not a <form> — there is nothing to
          submit: filtering happens on every keystroke. */}
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
            /* `type="text"`, not `type="search"` — the browser's own clear
               affordance sits at a different size in every engine and would
               land beside the button below. */
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
          /* Disabled while a page is in flight: each pick is a request, and a
             second one sent mid-flight makes which reply lands last a race. The
             select keeps showing its value throughout, so the toolbar still
             says what is being fetched. */
          disabled={disabled}
          /* Tinted when a status is applied, so a narrowed list is visible at
             a glance rather than only on reading the value. */
          className={`w-full cursor-pointer appearance-none rounded-xl border py-2 pl-9 pr-9 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-focus/20 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60 ${
            filtered
              ? 'border-orange-200 bg-orange-50 text-orange-700'
              : 'border-hairline-cool bg-white text-slate-700 hover:border-hairline-strong'
          }`}
        >
          {/* Colours set on each option: a native list otherwise inherits the
              select's own, and the "filtered" tint above would paint the whole
              open menu orange. */}
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
