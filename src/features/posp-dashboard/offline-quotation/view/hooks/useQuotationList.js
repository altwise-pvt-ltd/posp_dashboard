import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchQuoteQueue } from '../api/quoteQueueApi';
import { ALL, SEEN_STATUSES, mergeStatuses } from '../lib/quotationStatus';

/**
 * The list screen's whole state: the rows, the status filter, the search box
 * and the paging.
 *
 * Two of those three controls act in different places, which is the one thing
 * worth knowing about this hook:
 *
 *   status  — the *server* filters. A chip change is a new request, because the
 *             endpoint takes `?status=` and the app only ever holds a page.
 *   paging  — the server too. "Load more" appends the next page to what's held.
 *   search  — the *client*, over the pages loaded so far. There is no known
 *             search parameter on the endpoint, so this is the honest limit of
 *             what it can do, and the page says so on screen rather than
 *             letting a search over 20 of 200 rows look like a search over all
 *             of them.
 *
 * Chip counts are gone with the mock. The old ones were tallied from a complete
 * in-memory list; against a paged endpoint the same code would count the page
 * in hand and print it beside a label that claims to describe the queue.
 * Getting those back means per-status counts in the reply, not arithmetic here.
 */

const PAGE_SIZE = 20;

export { ALL };

/**
 * Append the next page, dropping any row already held.
 *
 * The dedupe is not paranoia about the server: React's StrictMode runs effects
 * twice in development, and a row inserted between two requests shifts every
 * page after it, so the same quote genuinely can arrive twice. Two rows with
 * one key is a React warning at best and a duplicated line in an agent's queue
 * at worst.
 */
const mergeById = (held, incoming) => {
  const seen = new Set(held.map((row) => row.id).filter(Boolean));
  return [...held, ...incoming.filter((row) => !row.id || !seen.has(row.id))];
};

/**
 * Reference, product, status, remark and originator — everything on a row that
 * is a word rather than a number. Matched as a substring on a lowercased
 * haystack, so "000008" finds a reference and "two" finds Two Wheeler.
 */
const matchesQuery = (row, needle) => {
  if (!needle) return true;

  const haystack = [
    row.quoteNumber,
    row.lob,
    row.product,
    row.statusLabel,
    row.statusCode,
    row.lastRemark,
    row.originatorName,
    row.originatorMobile,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
};

export function useQuotationList() {
  const [query, setQuery] = useState('');
  const [status, setStatusRaw] = useState(ALL);
  const [page, setPage] = useState(1);

  // Bumped by `retry` to re-run the effect without changing what it asks for.
  const [attempt, setAttempt] = useState(0);

  const [rows, setRows] = useState([]);
  /**
   * The status chips to offer.
   *
   * Held separately from `rows` because it must only ever grow: filtering to
   * Draft leaves nothing but drafts in `rows`, and a vocabulary derived from
   * those would collapse to a single chip — removing every control that undoes
   * the filter. See `mergeStatuses`.
   */
  const [statuses, setStatuses] = useState(SEEN_STATUSES);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Every fetch is started by this effect, but none of them *announce*
   * themselves here: `loading` is raised by whichever handler changed the
   * query, and only lowered once the reply lands.
   *
   * That split is not a style choice. Setting state synchronously in an effect
   * body schedules a second render before the first has painted (and trips
   * `react-hooks/set-state-in-effect`), whereas the click that caused the fetch
   * is already inside an event handler where a state change is free. The first
   * load has no handler to speak for it, so `loading` simply starts `true`.
   */
  useEffect(() => {
    const controller = new AbortController();
    let live = true;

    fetchQuoteQueue({
      // ALL means "every state", which is the parameter left off entirely.
      status: status === ALL ? null : status,
      page,
      pageSize: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        if (!live) return;

        // Page 1 is always a replacement — it is the first page of a *different*
        // query, since the only ways to reach it are a status change and a
        // retry. Anything above it is the same query continued.
        setRows((held) => (page === 1 ? result.items : mergeById(held, result.items)));
        setStatuses((known) => mergeStatuses(known, result.items));
        setTotalCount(result.totalCount);
        setHasNextPage(result.hasNextPage);
      })
      .catch((err) => {
        if (!live || controller.signal.aborted) return;

        setError(err);

        // A failed "load more" keeps the rows already on screen — they are
        // still true, and throwing them away punishes the agent for a request
        // they made on top of a list that was working.
        if (page === 1) {
          setRows([]);
          setTotalCount(0);
          setHasNextPage(false);
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [status, page, attempt]);

  /**
   * Changing the status always returns to page 1, and clears the rows before
   * the request lands.
   *
   * Without the clear, the previous status' rows stay on screen under the newly
   * lit chip for as long as the request takes — a list captioned "Draft"
   * showing converted quotes. Clearing makes it a loading state instead, which
   * is the truth.
   */
  const chosen = useRef(ALL);

  const setStatus = useCallback((next) => {
    // Read from a ref, not from `status`, so this callback never has to be
    // rebuilt — and the comparison happens here rather than inside a state
    // updater, which React may run more than once and which must stay pure.
    if (chosen.current === next) return;
    chosen.current = next;

    setStatusRaw(next);
    setPage(1);
    setRows([]);
    setTotalCount(0);
    setHasNextPage(false);
    setLoading(true);
    setError(null);
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) => matchesQuery(row, needle));
  }, [rows, query]);

  const loadMore = useCallback(() => {
    // Guarded here rather than only in the button: a second click while the
    // first page is still in flight would skip a page entirely.
    if (loading || !hasNextPage) return;

    setPage((current) => current + 1);
    setLoading(true);
    setError(null);
  }, [loading, hasNextPage]);

  const retry = useCallback(() => {
    setPage(1);
    setAttempt((n) => n + 1);
    setLoading(true);
    setError(null);
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setStatus(ALL);
  }, [setStatus]);

  return {
    /** Every row loaded so far, in the order the server returned them. */
    rows,
    /** Those of them that survive the search box. */
    visible,
    /** Every status this session has been told about, for the filter chips. */
    statuses,
    /** How many rows the *server* holds for the current status. */
    totalCount,

    query,
    setQuery,
    status,
    setStatus,

    /** True only while the first page of a query is in flight. */
    loading: loading && page === 1,
    /** True while "load more" is fetching, with rows already on screen. */
    loadingMore: loading && page > 1,
    hasNextPage,
    loadMore,

    error,
    retry,
    /** True when rows are held but the search box hides all of them. */
    filtered: rows.length > 0 && visible.length === 0,
    clearFilters,
  };
}
