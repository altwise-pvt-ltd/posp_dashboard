import { useCallback, useEffect, useState } from 'react';
import { fetchInsuranceTypes } from '../api/trainingApi';

/**
 * The training options, fetched once per mount of the choice screen.
 *
 * Local state rather than a store: the list is read on exactly one screen, it is
 * never written to, and it is stale the moment the LMS changes it — so caching
 * it across the session would only add a way for the page to be wrong.
 */
export function useInsuranceTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    return fetchInsuranceTypes()
      .then(setTypes)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let live = true;

    fetchInsuranceTypes()
      .then((data) => live && setTypes(data))
      .catch((err) => live && setError(err))
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
  }, []);

  return { types, loading, error, retry: load };
}
