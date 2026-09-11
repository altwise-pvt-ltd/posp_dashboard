import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { normalizeDirectives } from './quoteMetadataApi';

/**
 * `values` posts as a flat map of strings, so anything that isn't one is
 * dropped rather than stringified. That now includes attachments: a `File`
 * joined into a list reads as `[object File]` on the wire, which the server
 * would take for an answer.
 */
const toRuleValue = (value) => {
  if (Array.isArray(value)) {
    const parts = value.filter(
      (entry) => entry !== null && entry !== undefined && entry !== '' && typeof entry !== 'object'
    );
    return parts.length > 0 ? parts.join(',') : null;
  }
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') return null;
  return String(value);
};

export function buildRuleValues(values = {}) {
  const answered = {};

  for (const [fieldCode, raw] of Object.entries(values)) {
    const value = toRuleValue(raw);
    if (value !== null) answered[fieldCode] = value;
  }

  return answered;
}

export async function evaluateQuoteRules({ productId, subProductId, values = {} }) {
  const response = await api.post(ENDPOINTS.quotation.rulesEvaluate, {
    productId,
    subProductId: subProductId || null,
    values,
  });

  return normalizeDirectives(unwrap(response));
}
