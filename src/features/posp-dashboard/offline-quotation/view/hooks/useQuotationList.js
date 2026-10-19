import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchQuoteQueue } from '../api/quoteQueueApi';
import { ALL, SEEN_STATUSES, mergeStatuses } from '../lib/quotationStatus';

/**
 * The list screen's whole state: the rows, the status filter, the search box
 * and the paging.
 *
 *   status  — filtered by the server (`?status=`); a change goes back to page 1.
 *   paging  — the server too; each page replaces the rows on screen.
 *   search  — the client, over the page on screen only. The endpoint has no
 *             search parameter.
 */

const PAGE_SIZE = 10;

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
  // The page asked for, and the page the rows on screen belong to.
  const [page, setPageRaw] = useState(1);
  const [shownPage, setShownPage] = useState(1);

  // Bumped to re-run the fetch without changing what it asks for.
  const [attempt, setAttempt] = useState(0);

  const [rows, setRows] = useState([]);
  /**
   * The status chips to offer. Held apart from `rows` and only ever grown, so
   * filtering to one status doesn't remove the chips that undo it.
   */
  const [statuses, setStatuses] = useState(SEEN_STATUSES);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const lastPage = result.totalPages || Math.ceil(result.totalCount / PAGE_SIZE);

        // The queue shrank under us (e.g. a quote changed status) and this
        // page no longer exists — go to the new last page instead.
        if (result.items.length === 0 && page > 1 && lastPage >= 1 && page > lastPage) {
          setPageRaw(lastPage);
          return;
        }

        setRows(result.items);
        setStatuses((known) => mergeStatuses(known, result.items));
        setTotalCount(result.totalCount);
        setTotalPages(lastPage);
        setShownPage(page);
        setLoading(false);
      })
      .catch((err) => {
        if (!live || controller.signal.aborted) return;

        // Rows already on screen are kept; the page shows the error beside them.
        setError(err);
        setLoading(false);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [status, page, attempt]);

  /** Changing the status clears the rows and goes back to page 1. */
  const chosen = useRef(ALL);

  const setStatus = useCallback((next) => {
    if (chosen.current === next) return;
    chosen.current = next;

    setStatusRaw(next);
    setPageRaw(1);
    setShownPage(1);
    setRows([]);
    setTotalCount(0);
    setTotalPages(0);
    setLoading(true);
    setError(null);
  }, []);

  const setPage = useCallback((next) => {
    setPageRaw(next);
    // Also bumped so asking again for a page that just failed refetches it.
    setAttempt((n) => n + 1);
    setLoading(true);
    setError(null);
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) => matchesQuery(row, needle));
  }, [rows, query]);

  const retry = useCallback(() => {
    setPageRaw(1);
    setAttempt((n) => n + 1);
    setLoading(true);
    setError(null);
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setStatus(ALL);
  }, [setStatus]);

  const start = (shownPage - 1) * PAGE_SIZE;

  return {
    /** The rows of the page on screen, in the order the server returned them. */
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

    /** The page being fetched while loading, else the page on screen. */
    page: loading ? page : shownPage,
    pageCount: Math.max(1, totalPages),
    setPage,
    /** 1-based, inclusive, for the "Showing 11–20 of 87" line. */
    rangeStart: rows.length === 0 ? 0 : start + 1,
    rangeEnd: start + rows.length,

    /** True while there is nothing on screen yet: first load or a new status. */
    loading: loading && rows.length === 0,
    /** True while another page is fetching, with the old page still on screen. */
    paging: loading && rows.length > 0,

    error,
    retry,
    /** True when rows are held but the search box hides all of them. */
    filtered: rows.length > 0 && visible.length === 0,
    clearFilters,
  };
}
