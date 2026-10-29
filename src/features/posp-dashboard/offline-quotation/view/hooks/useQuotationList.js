import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchQuoteQueue } from '../api/quoteQueueApi';
import { ALL, SEEN_STATUSES, mergeStatuses } from '../lib/quotationStatus';

// Status and paging are server-side; search filters only the current page (the endpoint has no search param).

const PAGE_SIZE = 10;

// Case-insensitive substring match over the row's text fields.
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
  // Every status seen so far; only ever grows, so filtering doesn't drop the others.
  const [statuses, setStatuses] = useState(SEEN_STATUSES);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let live = true;

    fetchQuoteQueue({
      // ALL leaves the status parameter off.
      status: status === ALL ? null : status,
      page,
      pageSize: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        if (!live) return;

        const lastPage = result.totalPages || Math.ceil(result.totalCount / PAGE_SIZE);

        // The queue shrank and this page no longer exists; go to the new last page.
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

        // Existing rows are kept on error.
        setError(err);
        setLoading(false);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [status, page, attempt]);

  // Changing the status clears the rows and goes back to page 1.
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
    // Bumped so re-asking for a page that just failed refetches it.
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
    rows,
    visible,
    statuses,
    // Server total for the current status.
    totalCount,

    query,
    setQuery,
    status,
    setStatus,

    // The page being fetched while loading, else the page shown.
    page: loading ? page : shownPage,
    pageCount: Math.max(1, totalPages),
    setPage,
    // 1-based, inclusive.
    rangeStart: rows.length === 0 ? 0 : start + 1,
    rangeEnd: start + rows.length,

    // First load or new status, with no rows yet.
    loading: loading && rows.length === 0,
    // Another page is loading while the old rows are kept.
    paging: loading && rows.length > 0,

    error,
    retry,
    // Rows exist but the search hides all of them.
    filtered: rows.length > 0 && visible.length === 0,
    clearFilters,
  };
}
