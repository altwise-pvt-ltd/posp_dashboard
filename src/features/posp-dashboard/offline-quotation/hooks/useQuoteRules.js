import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildRuleValues, evaluateQuoteRules } from '../api/quoteRulesApi';

const DEBOUNCE_MS = 400;
const RETRY_MS = 2000;
const MAX_RETRIES = 2;

/**
 * Directives from POST rules/evaluate for the current answers, plus
 * evaluateNow(values), which Save awaits to validate against up-to-date rules.
 * A null `directives` means the metadata's own directives still apply.
 */
export function useQuoteRules({ productId, subProductId, values, evaluateOnMount = false }) {
  const payload = useMemo(() => JSON.stringify(buildRuleValues(values)), [values]);

  // The answers the current directives belong to. Set only when a call succeeds.
  // Normally the starting values are skipped. With evaluateOnMount (edit mode,
  // which opens with saved answers) they are sent straight away.
  const [answered, setAnswered] = useState(() => ({
    payload: evaluateOnMount ? null : payload,
    directives: null,
  }));

  // Failed attempts for one set of answers, so a failed call is sent again.
  const [failed, setFailed] = useState({ payload: null, count: 0 });

  const sequenceRef = useRef(0);
  const inflightRef = useRef(null);

  const request = useCallback(
    (body) => {
      if (inflightRef.current?.body === body) return inflightRef.current.promise;

      const sequence = (sequenceRef.current += 1);

      const promise = evaluateQuoteRules({ productId, subProductId, values: JSON.parse(body) })
        .then(
          (directives) => {
            if (sequence === sequenceRef.current) setAnswered({ payload: body, directives });
            return directives;
          },
          (error) => {
            if (sequence === sequenceRef.current) {
              setFailed((prev) => ({
                payload: body,
                count: prev.payload === body ? prev.count + 1 : 1,
              }));
            }
            throw error;
          }
        )
        .finally(() => {
          if (inflightRef.current?.promise === promise) inflightRef.current = null;
        });

      inflightRef.current = { body, promise };
      return promise;
    },
    [productId, subProductId]
  );

  useEffect(() => {
    if (!productId || payload === answered.payload) return undefined;

    const retrying = failed.payload === payload;
    if (retrying && failed.count > MAX_RETRIES) return undefined;

    const delay = retrying ? RETRY_MS : answered.payload === null ? 0 : DEBOUNCE_MS;

    const timer = setTimeout(() => {
      request(payload).catch(() => {});
    }, delay);

    return () => clearTimeout(timer);
  }, [productId, payload, answered.payload, failed, request]);

  // Resolves with the directives for exactly these values, calling the server
  // now if they haven't been answered yet. Rejects if the call fails.
  const evaluateNow = useCallback(
    (nextValues) => {
      const body = JSON.stringify(buildRuleValues(nextValues));
      if (!productId || body === answered.payload) return Promise.resolve(answered.directives);
      return request(body);
    },
    [productId, answered, request]
  );

  return { directives: answered.directives, evaluateNow };
}
