import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * What the insurers came back with — `GET /quote/<quoteId>/compare`.
 *
 * The reply is `{ quoteId, responses: [...] }`. An empty `responses` is a
 * normal, successful answer: the route does not 404 a quote nobody has
 * responded to, it says so with an empty list. So "no responses" and "failed to
 * ask" are different outcomes here and the hook reports them differently.
 *
 * ⚠ `insurerId` is a uuid and there is no insurer name anywhere in the reply —
 * nor any master list in this app to resolve one against. So the cards below
 * are headed by the *premium*, with the insurer's own reference beneath it,
 * because those are the only two things on a response an agent can actually
 * recognise. Ask the backend for `insurerName`; comparing two quotes by uuid is
 * not something anyone can do.
 */

const text = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
};

const number = (value) => (Number.isFinite(value) ? value : null);

/** A real boolean, or null when the field was absent rather than false. */
const flag = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

/**
 * The fields this app reads by name. Anything outside this set is carried
 * through as an extra rather than dropped — see `extras` below.
 */
const KNOWN = new Set([
  'responseId',
  'insurerId',
  'premium',
  'idv',
  'validTill',
  'isSelected',
  'isLowestPremium',
  'coverageJson',
  'receivedAt',
  'insurerQuoteRef',
  'quoteDocPath',
  'requestedAddOnCodes',
  'addOnPricingJson',
  'earningPoints',
  'earningStatus',
  'earningNote',
  'earningPlanName',
]);

/** `insurerName` → "Insurer name", for a field this app has never seen. */
const humanize = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
    )
    .join(' ');

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

    /** ⚠ A uuid. There is no name on this reply — see the note above. */
    insurerId: text(source.insurerId),
    /** The insurer's own reference for this quote — "ACK01234". */
    insurerQuoteRef: text(source.insurerQuoteRef),

    /** What the customer would pay. The headline figure on the card. */
    premium: number(source.premium),
    /** Insured declared value — the cover, not the price. */
    idv: number(source.idv),

    validTill: source.validTill ?? null,
    receivedAt: source.receivedAt ?? null,

    isSelected: flag(source.isSelected),
    /**
     * Parsed but deliberately not rendered.
     *
     * The panel prints no verdict of its own about which response is best, and
     * a "lowest premium" badge is exactly that — a claim the screen makes
     * rather than a figure an insurer sent. The premiums are shown plainly and
     * the comparison is left to the person making it. Kept on the object
     * because it is real server data and the next thing to want it (a sort
     * control, say) should not have to re-add it.
     */
    isLowestPremium: flag(source.isLowestPremium),

    /** A storage path, not a URL. ⚠ No route in this app serves it yet. */
    quoteDocPath: text(source.quoteDocPath),

    /* Unparsed on purpose. Both arrive null on every response seen so far, and
       guessing at the shape inside a blob named `...Json` is how the panel
       starts rendering `[object Object]`. Carried so they are not lost. */
    coverageJson: source.coverageJson ?? null,
    addOnPricingJson: source.addOnPricingJson ?? null,
    requestedAddOnCodes: source.requestedAddOnCodes ?? null,

    /** The agent's commission on this response. Not the customer's money. */
    earning: {
      points: number(source.earningPoints),
      status: text(source.earningStatus),
      planName: text(source.earningPlanName),
      note: text(source.earningNote),
    },

    /**
     * Anything the server started sending that this file does not name.
     *
     * A new field is a thing someone added on purpose, and silently dropping it
     * means nobody notices for a release. Rendered generically at the foot of
     * the card until it is given a proper place here.
     */
    extras: Object.entries(source)
      .filter(([key, value]) => !KNOWN.has(key) && value !== null && value !== undefined)
      .map(([key, value]) => ({ key, label: humanize(key), value })),
  };
};

/**
 * Fetch the responses on one quote, cheapest first.
 *
 * Sorted here rather than left in the server's order because this is a
 * *comparison*: the question an agent opens it with is which one is cheapest,
 * and the server's own `isLowestPremium` flag says it thinks in those terms
 * too. A response with no premium sorts last — it cannot be compared on the
 * thing the list is ordered by, so it does not get to lead.
 *
 * ⚠ The panel no longer says the list is ordered this way, so this is now an
 * arrangement the screen makes without announcing it. That is a deliberate
 * trade — the order helps and the caption was a claim — but if the server's
 * own order is ever meaningful, delete this sort rather than labelling it.
 *
 * Rejects on failure rather than answering an empty list — an empty list is
 * itself a fact the panel states, and a failed request dressed up as one would
 * tell the agent something untrue about their quote.
 */
export async function fetchQuoteResponses(quoteId, { signal } = {}) {
  const response = await api.get(ENDPOINTS.quotation.compare(quoteId), { signal });
  const data = unwrap(response);

  const responses = Array.isArray(data?.responses) ? data.responses.map(normalizeResponse) : [];

  responses.sort((a, b) => {
    if (a.premium === b.premium) return 0;
    if (a.premium === null) return 1;
    if (b.premium === null) return -1;
    return a.premium - b.premium;
  });

  return {
    quoteId: text(data?.quoteId) ?? quoteId,
    responses,
  };
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
