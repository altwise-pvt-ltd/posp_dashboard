import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { normalizeDirectives } from './quoteMetadataApi';

const toRuleValue = (value) => {
  if (Array.isArray(value)) return value.length > 0 ? value.join(',') : null;
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
