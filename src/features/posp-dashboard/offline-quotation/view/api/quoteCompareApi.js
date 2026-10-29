import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { number, text } from '@/features/posp-dashboard/offline-quotation/lib/normalize';
import { humanizeLabel } from '@/shared/lib/humanize';

// GET /quote/<quoteId>/compare returns { quoteId, responses }. An empty list is a valid answer, not a failure.
// ⚠ insurerName and insurerLogoUrl not seen on this reply; read under selectedOffer's names until confirmed.

// Boolean, or null when the field is absent.
const flag = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

// Fields read or deliberately skipped; anything else goes into `extras`.
const KNOWN = new Set([
  'responseId',
  'insurerId',
  'insurerName',
  'insurerLogoUrl',
  'premium',
  'idv',
  'validTill',
  'isSelected',
  // Ignored; ranking is done client-side.
  'isLowestPremium',
  'receivedAt',
  'insurerQuoteRef',
  'quoteDocPath',
  'earningPoints',
  'earningStatus',
  'earningNote',
  'earningPlanName',
]);

const isBlank = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);


const normalizeResponse = (entry, index) => {
  const source = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};

  return {
    key: text(source.responseId) ?? `response-${index}`,

    // The id `accept` takes, unlike `key` which may be a positional fallback. Null means it can't be selected.
    responseId: text(source.responseId),

    // ⚠ A uuid.
    insurerId: text(source.insurerId),
    // ⚠ Field names unconfirmed.
    insurerName: text(source.insurerName),
    insurerLogoUrl: text(source.insurerLogoUrl),
    // The insurer's own reference, e.g. "ACK01234".
    insurerQuoteRef: text(source.insurerQuoteRef),

    // What the customer would pay.
    premium: number(source.premium),
    // Insured declared value: the cover, not the price.
    idv: number(source.idv),

    validTill: source.validTill ?? null,
    receivedAt: source.receivedAt ?? null,

    isSelected: flag(source.isSelected),

    // A storage path, fetched as `<VITE_API_BASE_URL>/<path>`. ⚠ Unverified.
    quoteDocPath: text(source.quoteDocPath),

    // The agent's commission on this response, not the customer's premium.
    earning: {
      points: number(source.earningPoints),
      status: text(source.earningStatus),
      planName: text(source.earningPlanName),
      note: text(source.earningNote),
    },

    // Any other non-blank field, passed through with a readable label.
    // ⚠ coverageJson, addOnPricingJson and requestedAddOnCodes land here; their shape is unseen.
    extras: Object.entries(source)
      .filter(([key, value]) => !KNOWN.has(key) && !isBlank(value))
      .map(([key, value]) => ({ key, label: humanizeLabel(key), value })),
  };
};

// Responses in server order. Rejects on failure so it is never confused with an empty list.
export async function fetchQuoteResponses(quoteId, { signal } = {}) {
  const response = await api.get(ENDPOINTS.quotation.compare(quoteId), { signal });
  const data = unwrap(response);

  return Array.isArray(data?.responses) ? data.responses.map(normalizeResponse) : [];
}

// POST /quote/<id>/accept. Returns the envelope's message, since `data` may be null.
// The caller refetches the comparison to see the new selection.
export async function selectQuoteResponse(quoteId, responseId, { signal } = {}) {
  const response = await api.post(
    ENDPOINTS.quotation.accept(quoteId),
    { responseId },
    { signal }
  );

  return { message: response?.data?.message ?? null };
}
