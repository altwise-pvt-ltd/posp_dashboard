import { useCallback, useEffect, useState } from 'react';

/**
 * A category list, fetched once per mount.
 *
 * Takes the fetcher rather than naming one, because there are two lists with
 * identical shapes and different paths — `fetchCategories` for cards,
 * `fetchBrochureCategories` for brochures. Pass a stable reference: a fetcher
 * defined inline in a component is a new function every render and would
 * refetch on each one.
 *
 * Local state rather than a store, matching `useInsuranceTypes`: the list is
 * read on one screen, never written to, and stale the moment the content team
 * edits it — caching it across the session would only add a way to be wrong.
 */
export function useCategories(fetchList) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /* Bumped by `retry` so the effect below stays the only place the call is
   * made — see the same pattern in `useCategoryItems`. */
  const [attempt, setAttempt] = useState(0);

  /**
   * Bumping `attempt` re-runs the effect; clearing `error` is what makes the
   * result visible.
   *
   * Without that reset a successful retry loaded the categories and then went
   * on rendering the failure — `setCategories` had run, but the stale `error`
   * still won the branch above it, so the button looked broken precisely when
   * it had worked. `loading` goes back up for the same reason: the section
   * should show its skeleton while the second attempt is in flight.
   */
  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    /* `live` guards against a reply arriving after the screen is gone — a
     * setState on an unmounted component is a leak, and in StrictMode's double
     * mount it is also a guaranteed one. */
    let live = true;

    fetchList()
      .then((data) => live && setCategories(data))
      .catch((err) => live && setError(err))
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
  }, [fetchList, attempt]);

  return { categories, loading, error, retry };
}
