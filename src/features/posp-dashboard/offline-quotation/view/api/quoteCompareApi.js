import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { number, text } from '../../lib/normalize';
import { humanizeLabel } from '@/shared/lib/humanize';

/**
 * What the insurers came back with — `GET /quote/<quoteId>/compare`.
 *
 * The reply is `{ quoteId, responses: [...] }`. An empty `responses` is a
 * normal, successful answer: the route does not 404 a quote nobody has
 * responded to, it says so with an empty list. So "no responses" and "failed to
 * ask" are different outcomes here and the hook reports them differently.
 *
 * ⚠ `insurerName` and `insurerLogoUrl` have not been seen on this reply. They
 * are read under the names `/quote/<id>`'s `selectedOffer` uses; until the
 * backend confirms them a card falls back to "Insurer" and initials.
 */

/** A real boolean, or null when the field was absent rather than false. */
const flag = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

/**
 * The fields this app knows about, read or deliberately not shown. Anything
 * outside this set is carried through as an extra — see `extras` below.
 */
const KNOWN = new Set([
  'responseId',
  'insurerId',
  'insurerName',
  'insurerLogoUrl',
  'premium',
  'idv',
  'validTill',
  'isSelected',
  // Ranking is done client-side; ties on this flag are common.
  'isLowestPremium',
  'receivedAt',
  'insurerQuoteRef',
  'quoteDocPath',
  'earningPoints',
  'earningStatus',
  'earningNote',
  'earningPlanName',
]);

/** Null, undefined, blank or an empty list: nothing worth showing. */
const isBlank = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);


/**
 * One insurer's answer.
 *
 * `earning*` is the agent's own commission on this response, not anything the
 * insurer quoted — `earningStatus: "NO_GRID"` with a note saying no rate card
 * is configured is the common case today. It is kept apart from the money the
 * customer would pay, because confusing the two is the expensive mistake on
 * this screen.
 */
const normalizeResponse = (entry, index) => {
  const source = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};

  return {
    key: text(source.responseId) ?? `response-${index}`,

    /**
     * The id `accept` takes. Kept apart from `key` because the two
     * differ exactly when it matters: `key` falls back to a positional string
     * so React always has one, and posting `response-2` as a selection would be
     * sending the server an index of this app's own making. Null here means
     * "this response cannot be chosen", and the button is not offered.
     */
    responseId: text(source.responseId),

    /** ⚠ A uuid. */
    insurerId: text(source.insurerId),
    /** ⚠ Unconfirmed field names — see the note above. */
    insurerName: text(source.insurerName),
    insurerLogoUrl: text(source.insurerLogoUrl),
    /** The insurer's own reference for this quote — "ACK01234". */
    insurerQuoteRef: text(source.insurerQuoteRef),

    /** What the customer would pay. The headline figure on the card. */
    premium: number(source.premium),
    /** Insured declared value — the cover, not the price. */
    idv: number(source.idv),

    validTill: source.validTill ?? null,
    receivedAt: source.receivedAt ?? null,

    isSelected: flag(source.isSelected),

    /** A storage path, fetched as `<VITE_API_BASE_URL>/<path>`. ⚠ Unverified. */
    quoteDocPath: text(source.quoteDocPath),

    /** The agent's commission on this response. Not the customer's money. */
    earning: {
      points: number(source.earningPoints),
      status: text(source.earningStatus),
      planName: text(source.earningPlanName),
      note: text(source.earningNote),
    },

    /**
     * Anything the server sends that this file does not name, rendered
     * generically on the card. Includes `coverageJson`, `addOnPricingJson` and
     * `requestedAddOnCodes` once they arrive non-empty — their shape is unseen.
     */
    extras: Object.entries(source)
      .filter(([key, value]) => !KNOWN.has(key) && !isBlank(value))
      .map(([key, value]) => ({ key, label: humanizeLabel(key), value })),
  };
};

/**
 * Fetch the responses on one quote, in the server's order. The panel sorts them
 * (see `rankResponses`).
 *
 * Rejects on failure rather than answering an empty list — an empty list is
 * itself a fact the panel states.
 */
export async function fetchQuoteResponses(quoteId, { signal } = {}) {
  const response = await api.get(ENDPOINTS.quotation.compare(quoteId), { signal });
  const data = unwrap(response);

  return Array.isArray(data?.responses) ? data.responses.map(normalizeResponse) : [];
}

/**
 * Choose one of the insurers' answers — `POST /quote/<id>/accept`.
 *
 * The route is `accept`; the flag it sets on the comparison is `isSelected`,
 * and the button that calls it says "Select this policy". The function is named
 * for what the screen means by it rather than for the path, which is the one
 * place in this file that reads the other way round — `ENDPOINTS.quotation
 * .accept` keeps the server's word.
 *
 * Deliberately returns nothing but the server's sentence. The caller refetches
 * the comparison afterwards rather than marking the card selected itself: a
 * selection is a fact about the quote that other things turn on (the status may
 * move, the other responses may stop being selectable), and a card flipped to
 * "Selected" locally would be this app narrating a change it cannot see the
 * rest of.
 *
 * Reads `message` off the envelope for the same reason
 * `submitQuoteForVerification` does — a confirmation's worth is in its wording,
 * and `unwrap` reaches past it for a `data` that may well be null.
 */
export async function selectQuoteResponse(quoteId, responseId, { signal } = {}) {
  const response = await api.post(
    ENDPOINTS.quotation.accept(quoteId),
    { responseId },
    { signal }
  );

  return { message: response?.data?.message ?? null };
}
