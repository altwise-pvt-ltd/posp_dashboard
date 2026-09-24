import { Search, X } from 'lucide-react';
import { ALL } from '../lib/quotationStatus';

/**
 * The toolbar: one search field and the status chips.
 *
 * The two controls do not act in the same place, and that is deliberate rather
 * than accidental — see the note at the top of `useQuotationList`. A chip is a
 * request to the server; the field filters the rows already loaded.
 *
 * The chips no longer carry counts. They used to, when the whole list was in
 * memory and a tally was honest. Against a paged endpoint the only number
 * available is "how many are on the page in hand", which is not what a chip
 * labelled "Draft" would be read as claiming. The real total lives under the
 * list, where it can say what it is counting.
 *
 * The field is built here rather than reusing `shared/components/SearchBar`:
 * that one is uncontrolled and submits nothing, and `shared/components/Input`
 * carries a form row's label block and bottom margin. A toolbar needs a
 * controlled value and no margin.
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
     one chip that sends no `status` parameter. */
  const chips = [{ code: ALL, label: 'All' }, ...statuses];
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* `role="search"` on the wrapper, not a <form> — there is nothing to
          submit: filtering happens on every keystroke. */}
      <div role="search" className="lg:max-w-sm lg:flex-1">
        <label htmlFor="quotation-search" className="sr-only">
          Search loaded quotations
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 transition-all duration-300 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/20">
          <Search aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
          <input
            id="quotation-search"
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Reference, product or remark"
            /* `type="text"`, not `type="search"` — the browser's own clear
               affordance sits at a different size in every engine and would
               land beside the button below. */
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
              className="shrink-0 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/*
        Chips scroll sideways on a phone rather than wrapping onto a second
        line: five of them is wider than 390px, and a wrapped row pushes the
        table down by a whole line on the screen with the least room to spare.
        `-mx-1 px-1` lets the focus ring of the first and last chip stay inside
        the scroller instead of being clipped by it.
      */}
      <div
        role="group"
        aria-label="Filter by status"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chips.map((chip) => {
          const active = status === chip.code;

          return (
            <button
              key={chip.code}
              type="button"
              onClick={() => onStatusChange(chip.code)}
              aria-pressed={active}
              /* Disabled while a page is in flight: each chip is a request, and
                 a second one sent mid-flight makes which reply lands last a
                 race. The active chip stays lit throughout, so the toolbar
                 still says what is being fetched. */
              disabled={disabled && !active}
              className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuotationFilters;
