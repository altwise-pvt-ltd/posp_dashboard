import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Options for every `lookupSource` field, plus where each fetch stands.
 *
 * `status[code]` is `idle` (no fetcher, or waiting on its parent answer),
 * `loading`, `ready` or `error` — so a select can tell "still coming" and
 * "failed" apart from a list that really is empty. `retry(code)` drops a
 * failed entry and asks again.
 */
export function useLookupState(fields, values, fetchOptions) {
  const [cache, setCache] = useState({});
  const [attempt, setAttempt] = useState(0);
  const requestedRef = useRef(new Set());
  const canFetch = typeof fetchOptions === 'function';

  const plan = useMemo(
    () =>
      JSON.stringify(
        (fields ?? [])
          .filter((field) => field.lookupSource)
          .map((field) => {
            const parent = field.dependsOn ? values?.[field.dependsOn] : null;
            return {
              code: field.code,
              source: field.lookupSource,
              parent: parent === null || parent === undefined ? '' : String(parent),
              blocked: Boolean(field.dependsOn) && !parent,
            };
          })
      ),
    [fields, values]
  );

  useEffect(() => {
    if (!canFetch) return;

    const requested = requestedRef.current;

    for (const { source, parent, blocked } of JSON.parse(plan)) {
      const key = `${source}|${parent}`;
      if (blocked || requested.has(key)) continue;
      requested.add(key);

      fetchOptions({ source, parent })
        .then((list) => setCache((prev) => ({ ...prev, [key]: { list, failed: false } })))
        .catch(() => setCache((prev) => ({ ...prev, [key]: { list: [], failed: true } })));
    }
  }, [plan, fetchOptions, canFetch, attempt]);

  const retry = useCallback(
    (code) => {
      const entry = JSON.parse(plan).find((item) => item.code === code);
      if (!entry || entry.blocked) return;

      const key = `${entry.source}|${entry.parent}`;
      requestedRef.current.delete(key);
      setCache((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setAttempt((n) => n + 1);
    },
    [plan]
  );

  return useMemo(() => {
    const options = {};
    const status = {};

    for (const { code, source, parent, blocked } of JSON.parse(plan)) {
      const entry = cache[`${source}|${parent}`];
      options[code] = blocked ? [] : (entry?.list ?? []);
      status[code] =
        blocked || !canFetch ? 'idle' : !entry ? 'loading' : entry.failed ? 'error' : 'ready';
    }

    return { options, status, retry };
  }, [plan, cache, canFetch, retry]);
}

export function useLookupOptions(fields, values, fetchOptions) {
  return useLookupState(fields, values, fetchOptions).options;
}
