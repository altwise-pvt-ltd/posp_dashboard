import { api, unwrap, uploadConfig } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { text } from '../../lib/normalize';

/**
 * The RM's payment instruction on a quote — `GET /quote/<quoteId>/payment-instruction`.
 *
 * Resolves null when nothing has been published yet (the server answers
 * `data: null`), so "not yet" and "request failed" stay apart.
 */

/** A number, or a numeric string, as a number; null otherwise. */
const amountOf = (value) => {
  if (Number.isFinite(value)) return value;
  const parsed = typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

export const PAYMENT_METHODS = Object.freeze({
  BANK_TRANSFER: 'BankTransfer',
  PAYMENT_LINK: 'PaymentLink',
});

const normalizeInstruction = (data) => ({
  method: text(data.method),

  bank: {
    accountName: text(data.accountName),
    bankName: text(data.bankName),
    accountNumber: text(data.accountNumber),
    ifscCode: text(data.ifscCode),
    branch: text(data.branch),
  },

  paymentLink: text(data.paymentLink),
  linkExpiresAt: data.linkExpiresAt ?? null,

  amount: amountOf(data.amount),
  notes: text(data.notes),
  publishedAt: data.publishedAt ?? null,
});

export async function fetchPaymentInstruction(quoteId, { signal } = {}) {
  const response = await api.get(ENDPOINTS.quotation.paymentInstruction(quoteId), { signal });
  const data = unwrap(response);

  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return normalizeInstruction(data);
}

/**
 * Submit the agent's payment receipt — `POST /quote/<quoteId>/payment-receipt`.
 * An empty note is left out rather than sent blank.
 */
export async function submitPaymentReceipt(
  quoteId,
  { file, amountClaimed, referenceNo, paidOn, agentNote },
  { signal } = {}
) {
  const body = new FormData();
  body.append('file', file, file.name);
  body.append('amountClaimed', amountClaimed.trim());
  body.append('referenceNo', referenceNo.trim());
  body.append('paidOn', paidOn);
  if (agentNote?.trim()) body.append('agentNote', agentNote.trim());

  const response = await api.post(
    ENDPOINTS.quotation.paymentReceipt(quoteId),
    body,
    uploadConfig({ signal })
  );

  return { message: response?.data?.message ?? null };
}
