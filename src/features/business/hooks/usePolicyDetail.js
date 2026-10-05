import { useCallback, useEffect, useState } from 'react';
import { fetchPolicyDetail } from '../api/policyApi';

/**
 * The full record behind one list row, fetched when its drawer opens.
 * Pass null when no row is selected.
 */
export function usePolicyDetail(policyId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(Boolean(policyId));
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Clear the previous policy in the same render the id changes.
  const [shown, setShown] = useState(policyId);
  if (shown !== policyId) {
    setShown(policyId);
    setDetail(null);
    setError(null);
    setLoading(Boolean(policyId));
  }

  useEffect(() => {
    if (!policyId) return undefined;

    const controller = new AbortController();
    const { signal } = controller;
    let live = true;

    setLoading(true);
    setError(null);

    fetchPolicyDetail(policyId, { signal })
      .then((result) => {
        if (live) setDetail(result);
      })
      .catch((err) => {
        if (!live || signal.aborted) return;
        setError(err);
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [policyId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { detail, loading, error, retry };
}
