import { useCallback, useEffect, useState } from 'react';
import { fetchQuoteMetadata } from '../api/quoteMetadataApi';

const EMPTY = { scope: null, attempt: -1, metadata: null, error: null };

export function useQuoteMetadata(scope) {
  const [result, setResult] = useState(EMPTY);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!scope?.productId) return undefined;

    let live = true;

    fetchQuoteMetadata(scope)
      .then((data) => {
        if (live) setResult({ scope, attempt, metadata: data, error: null });
      })
      .catch((err) => {
        if (live) setResult({ scope, attempt, metadata: null, error: err });
      });

    return () => {
      live = false;
    };
  }, [scope, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  const settled = result.scope === scope && result.attempt === attempt;

  return {
    metadata: settled ? result.metadata : null,
    loading: Boolean(scope?.productId) && !settled,
    error: settled ? result.error : null,
    retry,
  };
}
