import { useEffect, useMemo, useRef, useState } from 'react';
import { buildRuleValues, evaluateQuoteRules } from '../api/quoteRulesApi';

const DEBOUNCE_MS = 400;

export function useQuoteRules({ productId, subProductId, values }) {
  const [directives, setDirectives] = useState(null);

  const payload = useMemo(() => JSON.stringify(buildRuleValues(values)), [values]);

  const sentRef = useRef(payload);
  const sequenceRef = useRef(0);

  useEffect(() => {
    if (!productId || payload === sentRef.current) return undefined;

    const timer = setTimeout(() => {
      sentRef.current = payload;
      const sequence = (sequenceRef.current += 1);

      evaluateQuoteRules({ productId, subProductId, values: JSON.parse(payload) })
        .then((next) => {
          if (sequence === sequenceRef.current) setDirectives(next);
        })
        .catch(() => {});
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [productId, subProductId, payload]);

  return directives;
}
