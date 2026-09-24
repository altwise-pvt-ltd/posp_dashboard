import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { normalizeRow } from './quoteQueueApi';

/**
 * One quote in full — `GET /quote/<quoteId>`.
 *
 * The reply is the queue row plus four things the list has no room for: the
 * three ids that identify the form it was raised on (`productId`,
 * `subProductId`, `fileType`), and `values` — every answer the agent gave, as a
 * flat list of `{ fieldCode, rowIndex, value }`.
 *
 * That list is the whole reason the detail screen takes two requests rather
 * than one. `values` carries codes, not questions: `MFG_YEAR` is `"2020"` and
 * `ZERO_DEP` is `"true"`, and nothing in the reply says that the first is
 * "Manufacturing year" or that the second is a tick-box on an add-on. The
 * labels live on `/quote/metadata`, which those three ids are exactly the
 * parameters for — so the quote is fetched, then the form it was raised on, and
 * the answers are read through it. See `useQuoteDetail`.
 */

const text = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
};

const number = (value) => (Number.isFinite(value) ? value : null);

/**
 * One answer. `rowIndex` is kept rather than flattened away: a repeatable
 * section stores its second entry under index 1, and collapsing the two would
 * render one row and silently lose the other.
 */
const normalizeValue = (entry = {}) => ({
  fieldCode: text(entry.fieldCode),
  rowIndex: Number.isFinite(entry.rowIndex) ? entry.rowIndex : 0,
  /* Not `text()` — `''` is preserved here and read as "asked, left blank",
     which the answer view treats differently from a field never sent at all. */
  value: typeof entry.value === 'string' ? entry.value : entry.value ?? null,
});

/**
 * The quote, in the shape the screen renders.
 *
 * The facts it shares with a queue row are read through the queue's own
 * `normalizeRow`, so the pill on this page and the pill in the list can never
 * drift apart on what `statusCode` means. Only the fields the list has no use
 * for are added on top.
 *
 * ⚠ `colorHex` is absent from this reply — see `recallStatusColor`.
 */
export const normalizeQuote = (data = {}) => ({
  ...normalizeRow(data),

  /** The three parameters `/quote/metadata` takes, to reread the form. */
  productId: text(data.productId),
  subProductId: text(data.subProductId),
  fileType: text(data.fileType),

  lobId: text(data.lobId),

  /**
   * What the agent expects the premium to come to. A different figure from
   * `sumInsured` and from whatever the insurer eventually quotes — it is the
   * agent's own estimate, and null until they enter one.
   */
  expectedPremium: number(data.expectedPremium),

  /** Last touched. The queue sends `ageDays` instead and never sends this. */
  updatedAt: data.updatedAt ?? null,

  originatorEmail: text(data.originatorEmail),

  values: Array.isArray(data.values) ? data.values.map(normalizeValue) : [],

  /**
   * Empty on every quote seen so far — the add-ons an agent ticked come back
   * inside `values` (`ZERO_DEP: "true"`), not here. Carried through anyway so a
   * payload that does start using it is not silently dropped.
   */
  addOns: Array.isArray(data.addOns) ? data.addOns : [],
});

/**
 * Fetch one quote.
 *
 * Rejects on failure rather than answering null — a 404 and a quote with no
 * content are different things, and the page says so differently. The caller
 * branches on `error.status`.
 */
export async function fetchQuote(quoteId, { signal } = {}) {
  const response = await api.get(ENDPOINTS.quotation.detail(quoteId), { signal });
  const data = unwrap(response);

  if (!data || typeof data !== 'object') return null;

  return normalizeQuote(data);
}

/**
 * Hand this quote to the back office — `POST /quote/<id>/submit-for-verification`.
 *
 * No payload. The quote is named in the path and everything else is already
 * stored, so there is nothing to send and nothing is sent.
 *
 * (A bodyless `POST` from curl answers 411 Length Required, which is a curl
 * artifact rather than a fact about this route: curl omits `Content-Length`
 * entirely, while XHR sets `Content-Length: 0` for a POST with a null body. So
 * this posts nothing and the browser satisfies IIS on its own.)
 *
 * Returns the envelope's `message` — "Submitted for verification." — not its
 * `data`, which is null on this route. `unwrap` is deliberately not used here:
 * it reaches for `data` and would throw the only sentence in the reply away.
 * A `success: false` body never reaches this line; the response interceptor in
 * `client.js` has already turned it into a rejected ApiError.
 */
export async function submitQuoteForVerification(quoteId, { signal } = {}) {
  const response = await api.post(ENDPOINTS.quotation.submitForVerification(quoteId), null, {
    signal,
  });

  return { message: response?.data?.message ?? null };
}
