import { useCallback, useEffect, useState } from 'react';

/**
 * useMasterOptions — load a `[{ value, label }]` list from a masters endpoint.
 *
 * Four steps need the same four things (the options, whether they're still
 * coming, whether they failed, and a way to ask again) around several different
 * endpoints, so the shape lives here rather than as four copies of the same
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
 * `fetcher` must be stable across renders — pass a module-level function, or one
 * wrapped in `useCallback`, not an inline arrow, or the effect re-runs on every
 * render.
 *
 * @param {() => Promise<Array<{ value: string, label: string }>>} fetcher
 * @param {{ enabled?: boolean }} [options] `enabled: false` holds the request
 *   back entirely — nothing is fetched until it flips true. Use it for a list
 *   behind a branch the user may never take, so the network cost follows what
 *   they're actually looking at. Defaults to true, which is the old behaviour.
 */
export function useMasterOptions(fetcher, { enabled = true } = {}) {
  /** Bumped by `reload` to re-run the effect; the count itself is unused
   *  except as the stamp on `result` below. */
  const [attempt, setAttempt] = useState(0);

  /**
   * The settled outcome, stamped with the attempt it belongs to:
   * `{ attempt, options, error }`, or null before the first one lands.
   *
   * Loading is *derived* from this rather than stored, and that is the whole
   * point of the stamp. A separate `loading` flag would have to be re-armed
   * from inside the effect every time `enabled` or `attempt` changed — which
   * is a cascading render on mount, and exactly what
   * `react-hooks/set-state-in-effect` objects to. Worse, it would be briefly
   * *wrong*: a list enabled late would read as "not loading, no options",
   * which `unavailable` reports as a failed fetch, so the step would flash its
   * error state for a frame before the request it just started came back.
   */
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    fetcher()
      .then((list) => {
        if (cancelled) return;
        setResult({ attempt, options: list, error: null });
      })
      .catch((fetchError) => {
        if (cancelled) return;
        // Options are dropped rather than left stale: a retry that fails should
        // not leave the previous attempt's options on screen next to an error
        // saying the list couldn't be loaded.
        setResult({ attempt, options: [], error: fetchError });
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, attempt, enabled]);

  /** Only an outcome stamped with the *current* attempt counts as settled, so
   *  `reload` puts the hook back into loading without touching a flag. */
  const settled = result?.attempt === attempt;

  const options = settled ? result.options : [];
  const error = settled ? result.error : null;
  const loading = enabled && !settled;

  /** Re-runs the effect. Nothing is set to "loading" here — bumping the attempt
   *  invalidates the stamp on `result`, which derives it. */
  const reload = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  /**
   * A list that arrived empty is as unusable as one that never arrived, and the
   * step's response to both is the same — say so, offer the retry, keep submit
   * shut — so callers get one flag rather than having to spell out the pair.
   *
   * A disabled list is neither: it was never asked for, so it cannot have
   * failed, and a step that read it as unavailable would block itself on a
   * request it deliberately hasn't made.
   */
  const unavailable = enabled && settled && options.length === 0;

  return { options, loading, error, reload, unavailable };
}
