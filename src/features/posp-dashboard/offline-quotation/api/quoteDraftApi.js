import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { isValuelessControl } from '@/shared/dynamic-form/components/fields/registry';

// One answer as a string for POST /quote/draft, or null if it can't be one.
// A cleared field is sent as '' so it overwrites the stored answer.
const toDraftValue = (value) => {
  if (Array.isArray(value)) {
    const parts = value.filter(
      (entry) => entry !== null && entry !== undefined && entry !== '' && typeof entry !== 'object'
    );
    return parts.join(',');
  }

  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return null;

  return String(value).trim();
};

// Visible answers as { fieldCode, value } pairs; built from fields so hidden answers are left out.
// File fields are skipped here; their files are uploaded separately after the draft is saved.
export function buildDraftValues(fields = [], values = {}) {
  const list = [];

  for (const field of fields) {
    if (field.control === 'file' || isValuelessControl(field.control)) continue;

    const value = toDraftValue(values[field.code]);
    if (value === null) continue;

    list.push({ fieldCode: field.code, value });
  }

  return list;
}

const isObject = (data) => Boolean(data) && typeof data === 'object' && !Array.isArray(data);

// Display number for the saved draft (e.g. QT-2026-000008); null if none of these keys is present.
const draftReference = (data) => {
  if (!isObject(data)) return null;
  return data.quoteNumber ?? data.draftNumber ?? data.reference ?? null;
};

// The quote's id from the reply's `quoteId` (confirmed by backend). Used for
// later saves and for /quote/<quoteId>/documents.
const draftId = (data) => {
  if (!isObject(data)) return null;
  return typeof data.quoteId === 'string' && data.quoteId ? data.quoteId : null;
};

// Creates a draft, or updates an existing quote when quoteId is given (omitted from the body on create).
// Backend confirmed there is no PUT/PATCH; updates go through this POST.
// ⚠ Unconfirmed: the body key `quoteId`, and whether the status changes after an update.
export async function saveQuoteDraft({ quoteId, productId, subProductId, fields, values } = {}) {
  const body = {
    ...(quoteId ? { quoteId } : {}),
    productId,
    subProductId: subProductId || null,
    values: buildDraftValues(fields, values),
  };

  const response = await api.post(ENDPOINTS.quotation.draft, body);
  const data = unwrap(response);

  return { id: draftId(data), reference: draftReference(data), data: data ?? null };
}
