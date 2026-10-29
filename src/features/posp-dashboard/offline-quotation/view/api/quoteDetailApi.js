import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { number, text } from '@/features/posp-dashboard/offline-quotation/lib/normalize';
import { normalizeRow } from './quoteQueueApi';

// GET /quote/<quoteId>: the queue row plus productId, subProductId, fileType and `values`.
// `values` holds field codes only; labels come from /quote/metadata (see useQuoteDetail).

// One answer. rowIndex keeps repeated section rows apart.
const normalizeValue = (entry = {}) => ({
  fieldCode: text(entry.fieldCode),
  rowIndex: Number.isFinite(entry.rowIndex) ? entry.rowIndex : 0,
  // Keeps '' so "left blank" differs from "never sent".
  value: typeof entry.value === 'string' ? entry.value : entry.value ?? null,
});

// The accepted insurer response and its proposal.
const normalizeSelectedOffer = (offer) => {
  if (!offer || typeof offer !== 'object' || Array.isArray(offer)) return null;

  return {
    insurerName: text(offer.insurerName),
    premium: number(offer.premium),
    idv: number(offer.idv),
    odPremium: number(offer.odPremium),
    tpPremium: number(offer.tpPremium),
    insurerQuoteRef: text(offer.insurerQuoteRef),
    validTill: offer.validTill ?? null,
    proposalNumber: text(offer.proposalNumber),
    proposalStatus: text(offer.proposalStatus),
    acceptedAt: offer.acceptedAt ?? null,
  };
};

// Shared fields go through the queue's normalizeRow so statusCode is read the same way.
// ⚠ colorHex is absent from this reply; see recallStatusColor.
const normalizeQuote = (data = {}) => ({
  ...normalizeRow(data),

  // The parameters /quote/metadata takes to reload the form.
  productId: text(data.productId),
  subProductId: text(data.subProductId),
  fileType: text(data.fileType),

  // The agent's own premium estimate; null until entered.
  expectedPremium: number(data.expectedPremium),

  // Only on this reply; the queue sends ageDays instead.
  updatedAt: data.updatedAt ?? null,

  values: Array.isArray(data.values) ? data.values.map(normalizeValue) : [],

  // Null until the agent accepts an insurer response.
  selectedOffer: normalizeSelectedOffer(data.selectedOffer),
});

// Rejects on failure; the caller branches on error.status (e.g. 404).
export async function fetchQuote(quoteId, { signal } = {}) {
  const response = await api.get(ENDPOINTS.quotation.detail(quoteId), { signal });
  const data = unwrap(response);

  if (!data || typeof data !== 'object') return null;

  return normalizeQuote(data);
}

// POST /quote/<id>/submit-for-verification with no body.
// Returns the envelope's message, since `data` is null on this route.
export async function submitQuoteForVerification(quoteId, { signal } = {}) {
  const response = await api.post(ENDPOINTS.quotation.submitForVerification(quoteId), null, {
    signal,
  });

  return { message: response?.data?.message ?? null };
}
