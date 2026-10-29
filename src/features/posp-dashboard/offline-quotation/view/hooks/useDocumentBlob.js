import { useEffect, useState } from 'react';
import { fetchDocBlob } from '../api/quoteDocumentListApi';

/**
 * Fetches one document's bytes (by path if it has one, else by id) and makes an object URL.
 * Results are keyed by request so a stale document is never shown; the URL is revoked on change.
 */
export function useDocumentBlob(quoteId, doc) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, blob: null, url: null, error: null });

  const docId = doc?.id ?? null;
  const docPath = doc?.path ?? null;
  const key = docId && (docPath || quoteId) ? `${quoteId}|${docId}|${attempt}` : null;

  useEffect(() => {
    if (!key) return undefined;

    let url = null;
    let live = true;

    fetchDocBlob(quoteId, { id: docId, path: docPath })
      .then((blob) => {
        if (!live) return;
        url = URL.createObjectURL(blob);
        setResult({ key, blob, url, error: null });
      })
      .catch((error) => {
        if (live) setResult({ key, blob: null, url: null, error });
      });

    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [key, quoteId, docId, docPath]);

  const current = key !== null && result.key === key;

  return {
    blob: current ? result.blob : null,
    url: current ? result.url : null,
    error: current ? result.error : null,
    loading: key !== null && !current,
    retry: () => setAttempt((n) => n + 1),
  };
}
