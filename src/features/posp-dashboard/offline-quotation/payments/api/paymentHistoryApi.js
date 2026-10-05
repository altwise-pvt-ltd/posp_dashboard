import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * The agent's premium payments — `GET /quote/payments/my?page=&pageSize=`.
 *
 * Every page is fetched so search covers the whole history.
 */

const PAGE_SIZE = 100;
// Stops a server that always reports hasNextPage from looping forever.
const MAX_PAGES = 50;

const text = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
};

const number = (value) => {
  if (Number.isFinite(value)) return value;
  const parsed = typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePayment = (item, index) => ({
  paymentId: text(item.paymentId) ?? `payment-${index}`,
  quoteId: text(item.quoteId),
  quoteNumber: text(item.quoteNumber),
  proposalId: text(item.proposalId),
  proposalNumber: text(item.proposalNumber),
  amount: number(item.amount),
  payee: text(item.payee),
  method: text(item.method),
  status: text(item.status),
  utrNo: text(item.utrNo),
  paidAt: item.paidAt ?? null,
  receivedAt: item.receivedAt ?? null,
});

export async function fetchMyPayments({ signal } = {}) {
  const payments = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await api.get(ENDPOINTS.quotation.paymentsMine, {
      params: { page, pageSize: PAGE_SIZE },
      signal,
    });
    const data = unwrap(response);
    const items = Array.isArray(data?.items) ? data.items : [];

    payments.push(...items.map((item, i) => normalizePayment(item, payments.length + i)));

    if (!data?.hasNextPage || items.length === 0) break;
  }

  return payments;
}
