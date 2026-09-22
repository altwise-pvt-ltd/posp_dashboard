import { useMemo, useState } from 'react';
import { usePolicies } from './usePolicies';
import { STATUS_ORDER } from '../lib/policyStatus';
import { SORT, isExpiringSoon, matchesQuery } from '../lib/policyFilters';
import { buildTrend } from '../lib/policyTrend';

/**
 * The Business screen's whole state: the rows, the three controls that narrow
 * or reorder them, and the totals drawn above them.
 *
 * The rows themselves come from `usePolicies`, which owns the one swap point
 * where this module becomes real. Everything here is derivation on top of it.
 */

export const ALL = 'ALL';

/**
 * The expiring-soon chip's value, kept out of `POLICY_STATUS` deliberately.
 *
 * It sits in the same control as the status chips because to the agent it is
 * the same question — "show me this slice of the book" — but it is a different
 * *kind* of predicate, so the filter below tests it separately rather than
 * comparing it against `policy.status`, which it will never equal.
 */
export const EXPIRING = 'EXPIRING';

/**
 * Rows per page.
 *
 * Ten, not the twenty-five a back-office grid would use: the table scrolls
 * inside its own box rather than moving the page, so a page of rows the agent
 * cannot see without scrolling twice buys nothing. Ten fits a laptop viewport
 * with one short scroll and keeps the summary strip and chart on screen while
 * the list is read.
 */
export const PAGE_SIZE = 10;

export function usePolicyList() {
  const [query, setQueryValue] = useState('');
  const [status, setStatusValue] = useState(ALL);
  const [sort, setSortValue] = useState('recent');
  const [page, setPage] = useState(1);

  /**
   * Every control resets to the first page.
   *
   * Narrowing the book to four rows while sitting on page three would show an
   * empty table over a filter that plainly matched something, so the three
   * setters are wrapped rather than left raw. Done here, not in an effect
   * watching the values: an effect would render the empty page once first.
   */
  const setQuery = (value) => {
    setQueryValue(value);
    setPage(1);
  };

  const setStatus = (value) => {
    setStatusValue(value);
    setPage(1);
  };

  const setSort = (value) => {
    setSortValue(value);
    setPage(1);
  };

  const { policies, now, loading, error, retry } = usePolicies();

  /**
   * Counts for the filter chips, over the *unfiltered* list.
   *
   * Deliberately not recomputed from the visible rows: a chip whose count moved
   * because the search box narrowed the list would be telling the user how many
   * results they already have, not how many policies are in that state.
   */
  const counts = useMemo(() => {
    const tally = Object.fromEntries(STATUS_ORDER.map((value) => [value, 0]));
    let expiring = 0;

    for (const policy of policies) {
      if (policy.status in tally) tally[policy.status] += 1;
      if (isExpiringSoon(policy, now)) expiring += 1;
    }

    // Expiring overlaps ACTIVE rather than partitioning alongside it — these
    // counts intentionally sum to more than the total.
    return { [ALL]: policies.length, ...tally, [EXPIRING]: expiring };
  }, [policies, now]);

  /**
   * The totals strip.
   *
   * Money and the renewal worklist, and deliberately not the four figures the
   * status chips already carry — `QuotationFilters` makes the point that chips
   * carrying their own counts are why that screen needs no tiles, and repeating
   * "Active: 6" a second time on this one would be the mistake it warns about.
   * What is here is what a count chip cannot say: how much the book is worth,
   * how much of it is still in force, and how much runs out this month.
   */
  const summary = useMemo(() => {
    let booked = 0;
    let active = 0;
    let expiring = 0;

    for (const policy of policies) {
      const premium = Number.isFinite(policy.premium) ? policy.premium : 0;

      booked += premium;
      if (policy.status === 'ACTIVE') active += premium;
      if (isExpiringSoon(policy, now)) expiring += 1;
    }

    return { booked, active, expiring, total: policies.length };
  }, [policies, now]);

  /**
   * The twelve-month premium trend.
   *
   * Over `policies`, not `visible` — the chart describes the book, the same as
   * the summary strip, and a trend that redrew itself every time the search
   * box narrowed the table would be plotting the filter rather than the
   * business. It sits outside the filter for the same reason the tiles do.
   */
  const trend = useMemo(() => buildTrend(policies, now), [policies, now]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matchesStatus = (policy) => {
      if (status === ALL) return true;
      if (status === EXPIRING) return isExpiringSoon(policy, now);
      return policy.status === status;
    };

    // Sorted after filtering, not before: the comparator runs over the rows
    // that survive rather than the whole book, and `sort` changing must not
    // re-run the filter work above it.
    return policies
      .filter((policy) => matchesStatus(policy) && matchesQuery(policy, needle))
      .sort(SORT[sort].compare(now));
  }, [policies, query, status, sort, now]);

  /**
   * How many pages the filtered list makes — at least one, so an empty result
   * reads as "page 1 of 1" rather than "of 0".
   */
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));

  /**
   * Clamped on read rather than corrected in state. The setters above cover
   * the user's own moves; this covers the ones they didn't make — a retry that
   * comes back with fewer rows, say — without a second render to fix `page`.
   */
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;

  const paged = useMemo(() => visible.slice(start, start + PAGE_SIZE), [visible, start]);

  return {
    policies,
    visible,
    paged,
    page: current,
    pageCount,
    pageSize: PAGE_SIZE,
    setPage,
    /** 1-based, inclusive, for the "Showing 4–6 of 27" line. */
    rangeStart: visible.length === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + PAGE_SIZE, visible.length),
    total: visible.length,
    counts,
    summary,
    trend,
    query,
    setQuery,
    status,
    setStatus,
    sort,
    setSort,
    now,
    /** True when there are policies, but none survive the current controls. */
    filtered: policies.length > 0 && visible.length === 0,
    loading,
    error,
    retry,
    clearFilters: () => {
      setQueryValue('');
      setStatusValue(ALL);
      setPage(1);
    },
  };
}
