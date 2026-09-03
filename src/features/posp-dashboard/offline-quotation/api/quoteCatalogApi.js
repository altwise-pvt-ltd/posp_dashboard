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
