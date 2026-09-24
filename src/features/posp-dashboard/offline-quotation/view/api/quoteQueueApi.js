import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { rememberStatusColor } from '../lib/quotationStatus';

/**
 * This agent's quote queue — `GET /quote/queue/mine`.
 *
 * One page per call. The server owns the order (newest first), the paging and
 * the status filter, so nothing here re-sorts or re-filters what it is given:
 * a page is a window onto a list the app has never seen in full, and sorting a
 * window is how a list ends up claiming an order it does not have.
 *
 * Everything the reply carries is normalised here and nowhere else, so the
 * components below take a shape this module defines rather than the server's.
 */

const EMPTY = Object.freeze({
  items: [],
  page: 1,
  pageSize: 0,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
});

/** A string with something in it, or null — `''` and `'  '` are both absences. */
const text = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
};

/** Numbers only. `null` sum insured means unpriced, and must not become 0. */
const number = (value) => (Number.isFinite(value) ? value : null);

const whole = (value) => (Number.isFinite(value) ? value : 0);

/**
 * One row of the queue.
 *
 * Exported because `/quote/<id>` describes the same quote and uses the same
 * field names for the facts both replies share. The detail screen reads its
 * header through this, so the two can never drift into rendering `statusCode`
 * one way in the list and another on the page it opens.
 *
 * ⚠ The reply's `status` is the *label* ("Draft") and `statusCode` is the value
 * ("DRAFT"). Two different things under two names one letter apart, on the same
 * object — so the label is renamed `statusLabel` on the way in. Nothing
 * downstream can then compare `row.status` against `'DRAFT'` and silently get
 * `false` on every row.
 *
 * `statusCode` is upper-cased because it travels back out as `?status=` and is
 * compared against the filter chips; the label is left exactly as sent, since
 * the server's capitalisation is the one the user should read.
 */
export const normalizeRow = (entry = {}) => {
  const statusCode = text(entry.statusCode)?.toUpperCase() ?? null;

  // The queue is the only reply that carries `colorHex`, so it is the only
  // place that can teach the app what a status looks like. See the note on
  // PALETTE in `quotationStatus.js`.
  rememberStatusColor(statusCode, text(entry.colorHex));

  return {
    /** The uuid. `/quote/<id>/documents` takes this; the quote number never does. */
    id: text(entry.id),
    quoteNumber: text(entry.quoteNumber),

    /**
     * Two levels, not the catalogue's three. `product` here ("Two Wheeler") is
     * what `/quote/catalog` calls a *sub*-product — there is no third field.
     */
    lob: text(entry.lob),
    product: text(entry.product),

    statusCode,
    statusLabel: text(entry.status),
    /** `#9AA3B2`. The server owns the status palette — see `quotationStatus.js`. */
    colorHex: text(entry.colorHex),

    /** ⚠ Sum insured, not premium. Null until the quote is priced. */
    sumInsured: number(entry.sumInsured),

    createdAt: entry.createdAt ?? null,
    /** Whole days since `createdAt`, counted server-side. Null when absent. */
    ageDays: number(entry.ageDays),

    lastRemark: text(entry.lastRemark),

    /**
     * Who raised it. Null on every row of a POSP's own queue — the originator is
     * the caller — but kept because the same row shape is what a back-office view
     * of someone else's queue would return, and because the search box can look
     * through them at no cost.
     */
    originatorName: text(entry.originatorName),
    originatorMobile: text(entry.originatorMobile),
  };
};

/**
 * One page of the caller's queue.
 *
 * `status` is the `statusCode` to narrow to, or a falsy value for every state —
 * the parameter is left off entirely rather than sent empty, because `?status=`
 * with nothing after it is a filter for the empty string on some stacks and no
 * filter at all on others.
 *
 * A reply whose `items` is not an array comes back as an empty page rather than
 * throwing: the call succeeded and the queue is empty is a reasonable reading,
 * and a genuine failure has already rejected by this point.
 */
export async function fetchQuoteQueue({ status, page = 1, pageSize = 20, signal } = {}) {
  const params = { page, pageSize };
  if (status) params.status = status;

  const response = await api.get(ENDPOINTS.quotation.queueMine, { params, signal });
  const data = unwrap(response);

  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
    return { ...EMPTY, page, pageSize };
  }

  return {
    items: data.items.map(normalizeRow),
    page: whole(data.page) || page,
    pageSize: whole(data.pageSize) || pageSize,
    totalCount: whole(data.totalCount),
    totalPages: whole(data.totalPages),
    /**
     * Read from the server rather than derived from `page < totalPages`: the
     * two disagree the moment a row is added between requests, and the server's
     * answer is the one computed against the query that produced these rows.
     */
    hasNextPage: Boolean(data.hasNextPage),
    hasPreviousPage: Boolean(data.hasPreviousPage),
  };
}
