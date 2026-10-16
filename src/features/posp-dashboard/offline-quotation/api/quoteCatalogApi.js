import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

/**
 * The offline-quotation product tree — `GET /quote/catalog`.
 *
 * One authenticated call returns every line of business with its products and
 * sub-products nested inside. Nothing here is filtered or reshaped beyond
 * defaulting the nullable fields, so the three selects on the create-quote
 * screen are all fed from a single fetch.
 */

const normalizeSubProduct = (entry = {}) => ({
  id: entry.id ?? null,
  code: entry.code ?? null,
  name: entry.name ?? '',
});

const normalizeProduct = (entry = {}) => ({
  id: entry.id ?? null,
  code: entry.code ?? null,
  name: entry.name ?? '',
  subProducts: (entry.subProducts ?? []).map(normalizeSubProduct),
});

const normalizeLob = (entry = {}) => ({
  id: entry.id ?? null,
  code: entry.code ?? null,
  name: entry.name ?? '',
  /** The server's icon hint for the LOB tile; null for lines that have none. */
  icon: entry.icon || null,
  /** Uploaded icon and picture; both behind the bearer token, so load them with `fetchCatalogImage`. */
  iconUrl: entry.iconUrl || null,
  imageUrl: entry.imageUrl || null,
  products: (entry.products ?? []).map(normalizeProduct),
});

/**
 * Every line of business a quote may be raised under.
 *
 * Rejects on failure — an empty list is a catalogue with nothing in it, which
 * is not the same thing as a call that never landed.
 */
export async function fetchQuoteCatalog() {
  const response = await api.get(ENDPOINTS.quotation.catalog);
  const data = unwrap(response);
  if (!Array.isArray(data)) return [];

  return data.map(normalizeLob);
}

const catalogImageRequests = new Map();

/**
 * The bytes behind a LOB's `iconUrl` or `imageUrl`, as a Blob.
 *
 * Cached per URL (the `?v=` on it changes when the image does); a failed fetch
 * is evicted so the next mount tries again. `skipAuthHandler` keeps a 401 here
 * from renewing or ending the session over a picture.
 */
export function fetchCatalogImage(url) {
  const cached = catalogImageRequests.get(url);
  if (cached) return cached;

  const request = api
    .get(url, { responseType: 'blob', skipAuthHandler: true })
    .then((response) => response.data)
    .catch((error) => {
      catalogImageRequests.delete(url);
      throw error;
    });

  catalogImageRequests.set(url, request);
  return request;
}

/** The products under one LOB, found by uuid or by `code`. */
export function findLobProducts(catalog, lob) {
  const match = (catalog ?? []).find((entry) => entry.id === lob || entry.code === lob);
  return match?.products ?? [];
}

/** The sub-products under one product of one LOB, found by uuid or by `code`. */
export function findProductSubProducts(catalog, lob, product) {
  const match = findLobProducts(catalog, lob).find(
    (entry) => entry.id === product || entry.code === product
  );
  return match?.subProducts ?? [];
}
