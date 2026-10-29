import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

// GET /quote/catalog: every line of business with its products and sub-products.

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
  icon: entry.icon || null,
  // Both need the bearer token; load them with fetchCatalogImage.
  iconUrl: entry.iconUrl || null,
  imageUrl: entry.imageUrl || null,
  products: (entry.products ?? []).map(normalizeProduct),
});

// Throws on a failed call instead of returning an empty list.
export async function fetchQuoteCatalog() {
  const response = await api.get(ENDPOINTS.quotation.catalog);
  const data = unwrap(response);
  if (!Array.isArray(data)) return [];

  return data.map(normalizeLob);
}

const catalogImageRequests = new Map();

// Fetches a LOB image as a Blob, cached per URL; a failed fetch is evicted so it can retry.
// skipAuthHandler stops a 401 here from refreshing or ending the session.
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
