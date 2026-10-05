import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * The POSP's policies — `GET /policies?page=&pageSize=`.
 *
 * Every page is fetched and concatenated: the chips, summary, sort and trend
 * all work over the whole book, so one server page is not enough.
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

// "Active" → "ACTIVE", the casing the status table and filters compare against.
const status = (value) => text(value)?.toUpperCase() ?? null;

// The server sends ids only, so product, insurer and mobile stay null.
const normalizePolicy = (item) => ({
  policyId: text(item.policyId),
  policyNumber: text(item.policyNumber),
  customerId: text(item.customerId),
  insurerId: text(item.insurerId),
  productId: text(item.productId),
  product: null,
  subProduct: null,
  insurer: null,
  customerName: text(item.insuredName),
  customerMobile: null,
  sumInsured: number(item.sumInsured),
  premium: number(item.premiumAmount),
  status: status(item.status),
  issuedAt: item.createdAt ?? null,
  startDate: item.startDate ?? null,
  endDate: item.endDate ?? null,
});

const normalizeDocument = (doc, index) => ({
  documentId: text(doc?.documentId) ?? `document-${index}`,
  documentType: text(doc?.documentType),
  documentKey: text(doc?.documentUrl),
  uploadedAt: doc?.uploadedAt ?? null,
});

const normalizePolicyDetail = (data) => ({
  ...normalizePolicy(data),
  insuredDob: data.insuredDob ?? null,
  nomineeName: text(data.nomineeName),
  nomineeRelation: text(data.nomineeRelation),
  notes: text(data.notes),
  cancellationReason: text(data.cancellationReason),
  cancelledAt: data.cancelledAt ?? null,
  renewedFromPolicyId: text(data.renewedFromPolicyId),
  documents: Array.isArray(data.documents) ? data.documents.map(normalizeDocument) : [],
});

/** One policy in full — `GET /policies/<policyId>`. */
export async function fetchPolicyDetail(policyId, { signal } = {}) {
  const response = await api.get(ENDPOINTS.policy.detail(policyId), { signal });
  const data = unwrap(response);

  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return normalizePolicyDetail(data);
}

export async function fetchPolicies({ signal } = {}) {
  const policies = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await api.get(ENDPOINTS.policy.list, {
      params: { page, pageSize: PAGE_SIZE },
      signal,
    });
    const data = unwrap(response);
    const items = Array.isArray(data?.items) ? data.items : [];

    policies.push(...items.map(normalizePolicy));

    if (!data?.hasNextPage || items.length === 0) break;
  }

  return policies;
}
