import { useCallback, useEffect, useState } from 'react';
import { fetchPolicies } from '../api/policyApi';

/**
 * The policy rows, and the one clock every date question is asked against.
 *
 * The single loader for the module: `usePolicyList` and `usePolicyTrend` both
 * sit on this, so the Business page and Overview's chart read the same rows.
 *
 * `now` is set from the same reply as `policies`, so "expiring within 30
 * days" is always asked of these rows as of the moment they were read.
 */
export function usePolicies() {
  const [state, setState] = useState({ policies: [], now: new Date() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let live = true;

    setLoading(true);
    setError(null);

    fetchPolicies({ signal })
      .then((policies) => {
        if (!live) return;
        setState({ policies, now: new Date() });
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
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { policies: state.policies, now: state.now, loading, error, retry };
}
