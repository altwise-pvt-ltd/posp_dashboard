import { api, unwrap } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { text } from '@/features/posp-dashboard/offline-quotation/lib/normalize';

// GET /quote/<quoteId>/documents, plus the file bytes behind each one.

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

// Blob requests cached per document so each is downloaded once; failures are dropped so they can retry.
const blobRequests = new Map();

// Past this the oldest entry is dropped; a dropped document is fetched again.
const CACHE_MAX = 24;

function cachedBlob(key, url) {
  const cached = blobRequests.get(key);
  if (cached) return cached;

  const request = requestBlob(url).catch((error) => {
    blobRequests.delete(key);
    throw error;
  });

  blobRequests.set(key, request);
  if (blobRequests.size > CACHE_MAX) blobRequests.delete(blobRequests.keys().next().value);

  return request;
}

// ⚠ The /quote/<quoteId>/documents/<docId> file route was probed, not confirmed.
export const fetchQuoteDocumentBlob = (quoteId, documentId) =>
  cachedBlob(`${quoteId}|${documentId}`, ENDPOINTS.quotation.documentFile(quoteId, documentId));

/** A stored file fetched by its storage path, e.g. an insurer's `quoteDocPath`. */
export const fetchStoredFileBlob = (path) =>
  cachedBlob(`path|${path}`, ENDPOINTS.quotation.storedFile(path));

/** A document with a `path` is fetched by path; otherwise by its id on the quote. */
export const fetchDocBlob = (quoteId, doc) =>
  doc.path ? fetchStoredFileBlob(doc.path) : fetchQuoteDocumentBlob(quoteId, doc.id);

/** A preview entry for a file known only by its storage path. */
export const docFromPath = (path) => ({
  id: `path|${path}`,
  path,
  fileName: String(path).split('/').filter(Boolean).pop() ?? 'Document',
  contentType: '',
  sizeBytes: null,
  uploadedAt: null,
});

/** If the server answers with JSON instead of the file, its message is raised. */
async function requestBlob(url) {
  const response = await api.get(url, { responseType: 'blob' });

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
