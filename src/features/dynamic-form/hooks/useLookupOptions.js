import { useEffect, useMemo, useRef, useState } from 'react';

export function useLookupOptions(fields, values, fetchOptions) {
  const [cache, setCache] = useState({});
  const requestedRef = useRef(new Set());

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
    if (typeof fetchOptions !== 'function') return;

    const requested = requestedRef.current;

    for (const { source, parent, blocked } of JSON.parse(plan)) {
      const key = `${source}|${parent}`;
      if (blocked || requested.has(key)) continue;
      requested.add(key);

      fetchOptions({ source, parent })
        .then((list) => setCache((prev) => ({ ...prev, [key]: list })))
        .catch(() => setCache((prev) => ({ ...prev, [key]: [] })));
    }
  }, [plan, fetchOptions]);

  return useMemo(() => {
    const resolved = {};

    for (const { code, source, parent, blocked } of JSON.parse(plan)) {
      resolved[code] = blocked ? [] : (cache[`${source}|${parent}`] ?? []);
    }

    return resolved;
  }, [plan, cache]);
}
