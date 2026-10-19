import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { text } from '../../lib/normalize';

/**
 * The documents stored on one quote — `GET /quote/<quoteId>/documents` — and
 * the bytes behind each one.
 */

const normalizeDocument = (entry = {}) => ({
  id: text(entry.id),
  code: text(entry.documentCode),
  fileName: text(entry.fileName) ?? 'Document',
  /** Storage key; matched against an insurer response's `quoteDocPath`. */
  filePath: text(entry.filePath),
  contentType: text(entry.contentType) ?? '',
  sizeBytes: Number.isFinite(entry.sizeBytes) ? entry.sizeBytes : null,
  status: text(entry.status),
  uploadedAt: entry.uploadedAt ?? null,
});

export async function fetchQuoteDocuments(quoteId, { signal } = {}) {
  const response = await api.get(ENDPOINTS.quotation.documents(quoteId), { signal });
  const data = unwrap(response);

  return Array.isArray(data) ? data.map(normalizeDocument).filter((doc) => doc.id) : [];
}

/**
 * The file as a Blob, shared between the thumbnail and the preview so each
 * document is downloaded once. A failed request is dropped from the cache so
 * it can be retried.
 */
const blobRequests = new Map();

// Past this the oldest entry is dropped; a dropped document is fetched again.
const CACHE_MAX = 24;

export function fetchQuoteDocumentBlob(quoteId, documentId) {
  const key = `${quoteId}|${documentId}`;
  const cached = blobRequests.get(key);
  if (cached) return cached;

  const request = requestBlob(quoteId, documentId).catch((error) => {
    blobRequests.delete(key);
    throw error;
  });

  blobRequests.set(key, request);
  if (blobRequests.size > CACHE_MAX) blobRequests.delete(blobRequests.keys().next().value);

  return request;
}

/** If the server answers with JSON instead of the file, its message is raised. */
async function requestBlob(quoteId, documentId) {
  const response = await api.get(ENDPOINTS.quotation.documentFile(quoteId, documentId), {
    responseType: 'blob',
  });

  const blob = response.data;

  if (blob?.type?.includes('json')) {
    let message = null;
    try {
      message = JSON.parse(await blob.text())?.message ?? null;
    } catch {
      // Not readable JSON; fall through to the generic message.
    }
    throw new Error(message || 'The file could not be loaded.');
  }

  return blob;
}

/* ── Display helpers ───────────────────────────────────────────────────── */

export const isImage = (doc) => doc?.contentType?.startsWith('image/');
export const isPdf = (doc) =>
  doc?.contentType === 'application/pdf' || /\.pdf$/i.test(doc?.fileName ?? '');

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
