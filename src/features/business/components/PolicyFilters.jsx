import { ArrowDownWideNarrow, Search, X } from 'lucide-react';
import { ALL, EXPIRING } from '../hooks/usePolicyList';
import { STATUS_ORDER, statusMeta } from '../lib/policyStatus';
import { SORT, SORT_ORDER } from '../lib/policyFilters';

/**
 * The toolbar: a search field, the status chips, and the sort control.
 *
 * The sort control is the one thing the quotations toolbar doesn't have, and
 * it is here because a policy book is genuinely read in two orders — newest
 * issued when you are checking your own work, soonest to expire when you are
 * working renewals. Quotations only ever want the first.
 *
 * The "Expiring" chip sits at the end of the status row, after a divider,
 * because it is not a status: a policy it matches is also matched by Active.
 * Placing it inline with no separation would imply the row partitions the book,
 * and the counts would then look like they fail to add up.
 *
 * The field is built here rather than reusing `shared/components/SearchBar`:
 * that one is uncontrolled and submits nothing, and `shared/components/Input`
 * carries a form row's label block and bottom margin. A toolbar needs a
 * controlled value and no margin.
 */
function PolicyFilters({ query, onQueryChange, status, onStatusChange, counts, sort, onSortChange }) {
  const statusChips = [
    { value: ALL, label: 'All' },
    ...STATUS_ORDER.map((value) => ({ value, label: statusMeta(value).label })),
  ];

  const chipClass = (active, urgent = false) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
      active
        ? 'border-orange-200 bg-orange-50 text-orange-700'
        : urgent
          ? 'border-orange-100 bg-white text-orange-700 hover:border-orange-200'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
    }`;

  const countClass = (active) =>
    `font-data-mono text-data-mono rounded-full px-1.5 ${
      active ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* `role="search"` on the wrapper, not a <form> — there is nothing to
            submit: filtering happens on every keystroke. */}
        <div role="search" className="lg:max-w-sm lg:flex-1">
          <label htmlFor="policy-search" className="sr-only">
            Search policies
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 transition-all duration-300 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/20">
            <Search aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
            <input
              id="policy-search"
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Policy no., customer, mobile, product or insurer"
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

        {/* A segmented pair, not a <select>: there are exactly two orders and
            they are both worth naming on screen. A dropdown would hide the
            renewal view behind a click on the screen that exists to surface it. */}
        <div
          role="group"
          aria-label="Sort policies"
          className="flex shrink-0 items-center gap-1 self-start rounded-xl border border-slate-200 bg-white p-1 lg:self-auto"
        >
          <ArrowDownWideNarrow
            aria-hidden="true"
            className="ml-1.5 size-4 shrink-0 text-slate-400"
          />
          {SORT_ORDER.map((key) => {
            const active = sort === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSortChange(key)}
                aria-pressed={active}
                className={`rounded-lg px-2.5 py-1 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
                  active
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {SORT[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/*
        Chips scroll sideways on a phone rather than wrapping onto a second
        line: six of them plus counts is wider than 390px, and a wrapped row
        pushes the table down by a whole line on the screen with the least room
        to spare. `-mx-1 px-1` lets the focus ring of the first and last chip
        stay inside the scroller instead of being clipped by it.
      */}
      <div
        role="group"
        aria-label="Filter policies"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {statusChips.map((chip) => {
          const active = status === chip.value;

          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onStatusChange(chip.value)}
              aria-pressed={active}
              className={chipClass(active)}
            >
              {chip.label}
              <span className={countClass(active)}>{counts[chip.value] ?? 0}</span>
            </button>
          );
        })}

        {/* The divider carries the "this one is a different question" message
            that the chip's own styling can only hint at. `h-6 self-center`
            rather than a full-height rule so it doesn't grow the scroller. */}
        <span aria-hidden="true" className="h-6 w-px shrink-0 self-center bg-slate-200" />

        <button
          type="button"
          onClick={() => onStatusChange(EXPIRING)}
          aria-pressed={status === EXPIRING}
          className={chipClass(status === EXPIRING, true)}
        >
          Expiring
          <span
            className={`font-data-mono text-data-mono rounded-full px-1.5 ${
              status === EXPIRING ? 'bg-orange-100 text-orange-700' : 'bg-orange-50 text-orange-700'
            }`}
          >
            {counts[EXPIRING] ?? 0}
          </span>
        </button>
      </div>
    </div>
  );
}

export default PolicyFilters;
