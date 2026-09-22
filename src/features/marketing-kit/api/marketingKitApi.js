import { notificationApi } from '@/shared/api/notificationClient';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * The Marketing Kit's reads — two parallel halves, cards and brochures, each
 * with its own category list and its own items-by-category call.
 *
 * Every call in here goes on `notificationApi`, not `api`. That is not a style
 * choice: the service is a different origin with a different credential, and
 * the shared client would send the POSP's bearer token to it and resolve the
 * path against the wrong base URL.
 *
 * The reply is a bare array. There is no `{ success, data }` envelope on this
 * service, so `unwrap` is not used and must not be added — it would look for a
 * `data` key that is never there.
 */

/**
 * Ascending `displayOrder`, ties broken by the row's own label so the order is
 * stable rather than dependent on whatever order the server happened to send.
 *
 * Categories label themselves `name` and banners `title`, and `displayOrder: 0`
 * on every row is a realistic reply from a content team that never set it — so
 * the tie-break is the common case, not the edge one, and reading the wrong
 * field would throw on exactly the payload this is here to handle.
 */
const byOrder = (a, b) =>
  a.order - b.order || String(a.name ?? a.title ?? '').localeCompare(String(b.name ?? b.title ?? ''));

/**
 * One category row → what the grid draws.
 *
 * `id` stays the raw GUID string: it is the key the templates call will be
 * made with, so it is carried through untouched rather than coerced.
 *
 * `description` collapses '' to null because the two mean the same thing to the
 * card — nothing to show under the title — and a component checking for one but
 * not the other renders an empty line for half the rows.
 */
const normalizeCategory = (entry = {}) => ({
  id: entry.id ?? null,
  name: entry.name ?? 'Untitled category',
  description: entry.description || null,
  order: Number(entry.displayOrder) || 0,
  isActive: entry.isActive !== false,
});

/** The categories an agent may browse — `GET /api/categories`. */
export async function fetchCategories() {
  return getList(ENDPOINTS.notification.categories, normalizeCategory);
}

/**
 * The brochure categories — `GET /api/brochure-categories`.
 *
 * Its own taxonomy, not a filter over the one above: a category id from the
 * cards list means nothing to `/api/brochures`, and crossing them fetches an
 * empty grid that reads as a category with nothing in it.
 */
export async function fetchBrochureCategories() {
  return getList(ENDPOINTS.notification.brochureCategories, normalizeCategory);
}

/**
 * Whatever a URL field holds → something the browser can actually open.
 *
 * The spec sample carries a placeholder host (`https://<your-host>/uploads/...`),
 * which is a fair sign the field is assembled server-side and may well arrive
 * relative instead. An absolute URL is passed straight through; a relative path
 * is resolved against the service origin, which is where the uploads live.
 *
 * Used for the PDFs as much as the artwork — `documentUrl` is assembled the
 * same way and can arrive relative for the same reason.
 *
 * Returns null rather than '' for anything unusable, so a card has one thing to
 * check and a missing preview is a deliberate placeholder rather than an <img>
 * that fires onError a beat after the layout settles.
 */
const resolveUrl = (value) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return null;

  try {
    /* Two-argument URL does both jobs: an absolute input ignores the base, a
     * relative one is joined to it. The try/catch covers a value that is
     * neither — a bare filename with a stray space, say. */
    return new URL(raw, notificationApi.defaults.baseURL).href;
  } catch {
    return null;
  }
};

/**
 * One banner row → what the grid draws.
 *
 * `linkUrl` is optional and is the only thing that makes a banner clickable, so
 * '' collapses to null for the same reason `description` does above: a card
 * checking one falsy form but not the other renders a link to nowhere.
 *
 * `categoryId` is carried even though the caller already knows which category
 * it asked for — it is what proves a row belongs where it was filed, and it
 * costs nothing to keep for the day banners are fetched across categories.
 */
const normalizeBanner = (entry = {}) => ({
  id: entry.id ?? null,
  categoryId: entry.categoryId ?? null,
  title: entry.title ?? 'Untitled',
  imageUrl: resolveUrl(entry.imageUrl),
  linkUrl: (typeof entry.linkUrl === 'string' && entry.linkUrl.trim()) || null,
  order: Number(entry.displayOrder) || 0,
  isActive: entry.isActive !== false,
});

/** The banners filed under one category — `GET /api/banners?categoryId=<guid>`. */
export async function fetchBanners(categoryId) {
  return getByCategory(ENDPOINTS.notification.banners, categoryId, normalizeBanner);
}

/**
 * One brochure row → what the grid draws.
 *
 * Two URLs, and they do different jobs: `thumbnailUrl` is the preview the card
 * shows, `documentUrl` the PDF the card opens. Both go through the same
 * resolver as a banner's image, for the same reason — the spec's samples carry
 * a placeholder host, so neither can be assumed absolute.
 *
 * A brochure with no `documentUrl` is still listed. It is the content team's
 * row to publish, and hiding it would make a half-uploaded brochure look like
 * one that was never created; the card shows it as not yet available instead.
 */
const normalizeBrochure = (entry = {}) => ({
  id: entry.id ?? null,
  categoryId: entry.categoryId ?? null,
  title: entry.title ?? 'Untitled',
  description: entry.description || null,
  thumbnailUrl: resolveUrl(entry.thumbnailUrl),
  documentUrl: resolveUrl(entry.documentUrl),
  order: Number(entry.displayOrder) || 0,
  isActive: entry.isActive !== false,
});

/**
 * The brochures filed under one category — `GET /api/brochures?categoryId=<guid>`.
 *
 * `categoryId` is the only parameter sent. The service documents `search` and
 * `isActive` too: `search` is a server-side title filter, left for the day the
 * lists are long enough to want one, and `isActive` is ignored for API-key
 * callers and forced to true — sending it would suggest this caller can ask for
 * retired brochures when it cannot.
 */
export async function fetchBrochures(categoryId) {
  return getByCategory(ENDPOINTS.notification.brochures, categoryId, normalizeBrochure);
}

/* ── The two shapes every call in this module has ──────────────────────── */

/**
 * A whole list — `GET <path>` with no parameters.
 *
 * Inactive rows are dropped here rather than in the page. `isActive: false` is
 * the service's way of retiring something without deleting it, so showing one
 * would offer a section that is meant to be gone — and leaving the filter to
 * the UI means the next screen reading this list has to remember to repeat it.
 *
 * Resolves to `[]` for a non-array body so a shape change reads as "nothing
 * here" rather than a crash inside `.map`. Rejects on a failed request: an
 * empty list and a call that never landed are different things, and the page
 * says so differently.
 */
async function getList(path, normalize) {
  const response = await notificationApi.get(path);
  return toRows(response, normalize);
}

/**
 * One category's worth — `GET <path>?categoryId=<guid>`.
 *
 * Rejects without calling when `categoryId` is missing. The parameter is what
 * scopes the request, and a server that answers an unscoped call with
 * everything it has would fill the grid with other categories' content — which
 * looks like working code and is the harder bug to notice.
 */
async function getByCategory(path, categoryId, normalize) {
  if (!categoryId) {
    throw new Error(`${path} requires a categoryId.`);
  }

  const response = await notificationApi.get(path, { params: { categoryId } });
  return toRows(response, normalize);
}

/** Body → rows, for all four calls: normalize, drop the retired, order. */
function toRows(response, normalize) {
  const body = response?.data;
  if (!Array.isArray(body)) return [];

  return body
    .map(normalize)
    .filter((row) => row.isActive && row.id)
    .sort(byOrder);
}
