import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { number, text } from '@/features/posp-dashboard/offline-quotation/lib/normalize';
import { rememberStatusColor } from '../lib/quotationStatus';

// GET /quote/queue/mine, one page per call. The server owns order (newest first),
// paging and the status filter, so nothing is re-sorted or re-filtered here.

const EMPTY = Object.freeze({
  items: [],
  page: 1,
  pageSize: 0,
  totalCount: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
});

const whole = (value) => (Number.isFinite(value) ? value : 0);

// One queue row. Also used by quoteDetailApi, whose reply shares these fields.
// The reply's `status` is the label ("Draft") and `statusCode` the value ("DRAFT"),
// so the label is renamed statusLabel. statusCode is upper-cased because it is sent back as ?status=.
export const normalizeRow = (entry = {}) => {
  const statusCode = text(entry.statusCode)?.toUpperCase() ?? null;

  // Only the queue reply carries colorHex, so remember it for replies that don't.
  rememberStatusColor(statusCode, text(entry.colorHex));

  return {
    // The uuid; /quote/<id>/documents takes this, not the quote number.
    id: text(entry.id),
    quoteNumber: text(entry.quoteNumber),

    // `product` here is what /quote/catalog calls a sub-product.
    lob: text(entry.lob),
    product: text(entry.product),

    statusCode,
    statusLabel: text(entry.status),
    // e.g. "#9AA3B2"
    colorHex: text(entry.colorHex),

    // ⚠ Sum insured, not premium. Filled or null regardless of status; source field unconfirmed.
    sumInsured: number(entry.sumInsured),

    // The selected offer's premium and insurer; null until an offer is selected.
    premium: number(entry.premium),
    insurerName: text(entry.insurerName),

    createdAt: entry.createdAt ?? null,
    // Whole days since createdAt, counted server-side.
    ageDays: number(entry.ageDays),

    lastRemark: text(entry.lastRemark),

    // Who raised it. Null on a POSP's own queue; kept for search.
    originatorName: text(entry.originatorName),
    originatorMobile: text(entry.originatorMobile),
  };
};

// One page of the caller's queue. A falsy `status` is left off rather than sent empty.
// A reply without an items array is treated as an empty page.
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
    // Taken from the server rather than derived from page < totalPages.
    hasNextPage: Boolean(data.hasNextPage),
    hasPreviousPage: Boolean(data.hasPreviousPage),
  };
}
