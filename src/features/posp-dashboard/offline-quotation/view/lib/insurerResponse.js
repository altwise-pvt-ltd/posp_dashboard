import { daysUntil } from '@/shared/lib/format';

/** Helpers for rendering and ranking insurer responses from `/quote/<id>/compare`. */

/** Column template shared by every response row, so the figures line up across cards. */
export const RESPONSE_COLUMNS =
  'md:grid md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] md:items-center md:gap-x-6';

export const SORT_OPTIONS = [
  { value: 'best', label: 'Best value' },
  { value: 'premium', label: 'Lowest premium' },
  { value: 'idv', label: 'Highest IDV' },
  { value: 'expiring', label: 'Expiring soon' },
];

export const DEFAULT_SORT = 'best';

/** True once `validTill` is before today. A missing date never counts as expired. */
export const isExpired = (validTill) => (daysUntil(validTill) ?? 0) < 0;

const timeOf = (value) => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

/** Compares two nullable numbers; nulls go last. `direction` -1 sorts high to low. */
const nullsLast = (a, b, direction = 1) => {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * direction;
};

/** Lowest premium, then highest IDV, then latest validTill. */
const byBestValue = (a, b) =>
  nullsLast(a.premium, b.premium) ||
  nullsLast(a.idv, b.idv, -1) ||
  nullsLast(timeOf(a.validTill), timeOf(b.validTill), -1);

const COMPARE = {
  best: byBestValue,
  premium: (a, b) => nullsLast(a.premium, b.premium),
  idv: (a, b) => nullsLast(a.idv, b.idv, -1) || byBestValue(a, b),
  expiring: (a, b) => nullsLast(timeOf(a.validTill), timeOf(b.validTill)) || byBestValue(a, b),
};

/**
 * Orders the responses and marks the single best-value one. Expired responses
 * sort last and are never best. The badge only appears when there are at least
 * two live, priced responses to compare.
 */
export function rankResponses(responses, sortKey = DEFAULT_SORT) {
  const candidates = responses
    .filter((response) => response.premium !== null && !isExpired(response.validTill))
    .sort(byBestValue);
  const best = candidates.length > 1 ? candidates[0] : null;
  const compare = COMPARE[sortKey] ?? byBestValue;

  return [...responses]
    .sort(
      (a, b) =>
        Number(isExpired(a.validTill)) - Number(isExpired(b.validTill)) || compare(a, b)
    )
    .map((response) => {
      const other = Boolean(best) && response !== best;

      return {
        response,
        expired: isExpired(response.validTill),
        isBest: response === best,
        premiumDelta:
          other && response.premium !== null && response.premium > best.premium
            ? response.premium - best.premium
            : null,
        lowerIdv: other && response.idv !== null && best.idv !== null && response.idv < best.idv,
      };
    });
}

/**
 * True when an earning carries points the grid will actually pay. `NO_GRID`
 * means there is no grid behind the figure, so the points are not shown.
 */
export const hasEarningPoints = (earning) =>
  earning?.points != null && earning.status !== 'NO_GRID';

/** The stored document whose `filePath` is this response's `quoteDocPath`, or null. */
export const findQuoteDocument = (documents, path) =>
  (path && documents.find((doc) => doc.filePath === path)) || null;

/** "Insurer quote" for the preview header, with the insurer's name when known. */
export const quoteDocumentLabel = (response) =>
  response.insurerName ? `${response.insurerName} quote` : 'Insurer quote';

/** "HDFC Ergo" → "HE"; null when there is no name. */
export const insurerInitials = (name) => {
  const letters = String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return letters || null;
};

/** An extra field's value as text. */
export const formatExtraValue = (value) =>
  typeof value === 'object' ? JSON.stringify(value) : String(value);
