/**
 * Labels for a payment row's status, method and payee.
 *
 * ⚠ Only "Success", "NEFT_RTGS" and "Insurer" have been seen. The other
 * entries are guesses; an unknown value is shown as the server sent it, in a
 * neutral pill, rather than mapped to the wrong one.
 */

import { humanizeLabel } from '@/shared/lib/humanize';
import { formatCurrencyPreserve } from '@/shared/lib/format';

const normalise = (value) =>
  typeof value === 'string' ? value.trim().toUpperCase().replace(/[\s-]+/g, '_') : '';

const STATUS_TABLE = {
  SUCCESS: { label: 'Success', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  PENDING: { label: 'Pending', pill: 'bg-amber-50 text-amber-800 ring-amber-100' },
  FAILED: { label: 'Failed', pill: 'bg-rose-50 text-rose-700 ring-rose-100' },
  REJECTED: { label: 'Rejected', pill: 'bg-rose-50 text-rose-700 ring-rose-100' },
};

const NEUTRAL = 'bg-slate-100 text-slate-600 ring-slate-200';

export const paymentStatusMeta = (value) =>
  STATUS_TABLE[normalise(value)] ?? { label: value || 'Unknown', pill: NEUTRAL };

const METHOD_LABELS = {
  NEFT_RTGS: 'NEFT / RTGS',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  PAYMENT_LINK: 'Payment link',
  PAYMENTLINK: 'Payment link',
};

export const formatMethod = (value) => {
  if (!value) return '—';
  return METHOD_LABELS[normalise(value)] ?? humanizeLabel(value);
};

export const formatPayee = (value) => (value ? humanizeLabel(value) : '—');
