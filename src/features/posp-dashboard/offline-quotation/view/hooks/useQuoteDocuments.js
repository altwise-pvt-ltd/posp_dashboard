import { useCallback, useEffect, useState } from 'react';
import { fetchQuoteDocuments } from '../api/quoteDocumentListApi';

// Loads a quote's documents. The last good list is kept while the same quote
// refreshes, but never shown under a different quote.
export function useQuoteDocuments(quoteId) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState({ quoteId: null, documents: [] });
  const [settled, setSettled] = useState({ key: null, error: null });

  const key = quoteId ? `${quoteId}|${attempt}` : null;

  useEffect(() => {
    if (!key) return undefined;

    const controller = new AbortController();
    const { signal } = controller;

    fetchQuoteDocuments(quoteId, { signal })
      .then((result) => {
        if (signal.aborted) return;
        setLoaded({ quoteId, documents: result });
        setSettled({ key, error: null });
      })
      .catch((error) => {
        if (signal.aborted) return;
        setSettled({ key, error });
      });

    return () => controller.abort();
  }, [key, quoteId]);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);
  const current = settled.key === key;

  return {
    documents: loaded.quoteId === quoteId ? loaded.documents : [],
    loading: key !== null && !current,
    error: current ? settled.error : null,
    refresh,
  };
}
