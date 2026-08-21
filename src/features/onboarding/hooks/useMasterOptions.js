import { useCallback, useEffect, useState } from 'react';

/**
 * useMasterOptions — load a `[{ value, label }]` list from a masters endpoint.
 *
 * Three steps need the same four things (the options, whether they're still
 * coming, whether they failed, and a way to ask again) around three different
 * endpoints, so the shape lives here rather than as three copies of the same
 * effect.
 *
 * There is deliberately no fallback list. An earlier version of this kept a
 * hardcoded copy of each list to serve when the request failed, and it was the
 * wrong trade twice over. The masters endpoints sit on the same host as the
 * save endpoints, so a masters list that can't be reached almost never means a
 * step that could otherwise have been submitted — it means a form that looks
 * fillable and fails at the end instead of the start. And a local copy is
 * exactly the drift these endpoints exist to eliminate: add an option on the
 * server and the fallback keeps quietly serving the old set, which is the bug
 * this whole mechanism was introduced to fix. Failing visibly, with a retry, is
 * both more honest and less work to keep correct.
 *
 * `fetcher` must be stable across renders — pass a module-level function, not
 * an inline arrow, or the effect re-runs on every render.
 *
 * @param {() => Promise<Array<{ value: string, label: string }>>} fetcher
 */
export function useMasterOptions(fetcher) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** Bumped by `reload` to re-run the effect; the count itself is unused. */
  const [attempt, setAttempt] = useState(0);

  /**
   * The effect deliberately sets no state synchronously — `loading` starts true
   * and is put back to true by `reload` below, which runs from a click rather
   * than from render. Setting it here instead would be a cascading render on
   * every mount, which `react-hooks/set-state-in-effect` rightly objects to.
   */
  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((list) => {
        if (cancelled) return;
        setOptions(list);
        setLoading(false);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        // Cleared rather than left stale: a retry that fails should not leave
        // the previous attempt's options on screen next to an error saying the
        // list couldn't be loaded.
        setOptions([]);
        setError(fetchError);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, attempt]);

  /** Re-arms the loading state here, in the handler, then re-runs the effect. */
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  /**
   * A list that arrived empty is as unusable as one that never arrived, and the
   * step's response to both is the same — say so, offer the retry, keep submit
   * shut — so callers get one flag rather than having to spell out the pair.
   */
  const unavailable = !loading && options.length === 0;

  return { options, loading, error, reload, unavailable };
}
