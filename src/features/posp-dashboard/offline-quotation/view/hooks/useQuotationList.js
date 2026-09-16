import { useMemo, useState } from 'react';
import { MOCK_QUOTATIONS } from '../data/mockQuotations';
import { STATUS_ORDER } from '../lib/quotationStatus';

/**
 * The list screen's whole state: the rows, and the two controls that narrow
 * them.
 *
 * ⚠ The single point where this screen becomes real. `loadQuotations` below is
 * the seam — when `GET /quote/...` exists, that function becomes the request
 * and the rest of this hook is unchanged, because everything after it already
 * works on a plain array. Nothing outside this file imports the mock.
 *
 * `loading` and `error` are part of the returned shape from the start, even
 * though a synchronous array can never be either. They exist so the page
 * renders its waiting and failure states today rather than having them grafted
 * on later, when the difference between "no quotes" and "the request failed"
 * stops being hypothetical.
 */

/** ⚠ Swap point — see the note above. Replace the body, keep the signature. */
const loadQuotations = () => MOCK_QUOTATIONS;

export const ALL = 'ALL';

/**
 * Newest first.
 *
 * Sorted here rather than trusted from the source: a backend list arrives in
 * whatever order its query produced, and an agent scanning this page is looking
 * for what they raised this morning.
 */
const byNewest = (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);

/**
 * Reference, customer name, mobile and product — the four things an agent has
 * to hand when they come looking. Matched as a substring on a lowercased
 * haystack, so "9822" finds a number and "priv" finds Private Car.
 */
const matchesQuery = (quotation, query) => {
  if (!query) return true;

  const haystack = [
    quotation.quoteNumber,
    quotation.customerName,
    quotation.customerMobile,
    quotation.product,
    quotation.subProduct,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
};

export function useQuotationList() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(ALL);

  // Sorted once, not on every keystroke — filtering below re-runs when the
  // query changes, but the order never does.
  const quotations = useMemo(() => [...loadQuotations()].sort(byNewest), []);

  /**
   * Counts for the filter chips, over the *unfiltered* list.
   *
   * Deliberately not recomputed from the visible rows: a chip whose count moved
   * because the search box narrowed the list would be telling the user how many
   * results they already have, not how many quotes are in that state.
   */
  const counts = useMemo(() => {
    const tally = Object.fromEntries(STATUS_ORDER.map((value) => [value, 0]));

    for (const quotation of quotations) {
      if (quotation.status in tally) tally[quotation.status] += 1;
    }

    return { [ALL]: quotations.length, ...tally };
  }, [quotations]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return quotations.filter(
      (quotation) =>
        (status === ALL || quotation.status === status) && matchesQuery(quotation, needle)
    );
  }, [quotations, query, status]);

  return {
    quotations,
    visible,
    counts,
    query,
    setQuery,
    status,
    setStatus,
    /** True when there are quotes, but none survive the current controls. */
    filtered: quotations.length > 0 && visible.length === 0,
    loading: false,
    error: null,
    // A no-op against the mock. Returned now so the page's error state already
    // has something to call when `loadQuotations` becomes a request.
    retry: () => {},
    clearFilters: () => {
      setQuery('');
      setStatus(ALL);
    },
  };
}
