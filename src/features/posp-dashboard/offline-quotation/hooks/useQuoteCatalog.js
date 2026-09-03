import { useCallback, useEffect, useState } from 'react';
import { fetchQuoteCatalog } from '../api/quoteCatalogApi';

export function useQuoteCatalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    (isLive = () => true) =>
      fetchQuoteCatalog()
        .then((data) => {
          if (!isLive()) return;
          setCatalog(data);
          setError(null);
        })
        .catch((err) => {
          if (!isLive()) return;
          setCatalog([]);
          setError(err);
        })
        .finally(() => {
          if (isLive()) setLoading(false);
        }),
    []
  );

  useEffect(() => {
    let live = true;
    load(() => live);

    return () => {
      live = false;
    };
  }, [load]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    return load();
  }, [load]);

  return { catalog, loading, error, retry };
}
