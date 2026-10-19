import { useMemo, useState } from 'react';
import { DEFAULT_SORT, rankResponses } from '../lib/insurerResponse';

/** The insurer responses in the chosen order, with the best-value row and deltas marked. */
export function useRankedResponses(responses) {
  const [sortKey, setSortKey] = useState(DEFAULT_SORT);

  const rows = useMemo(() => rankResponses(responses, sortKey), [responses, sortKey]);
  const anySelected = useMemo(() => responses.some((response) => response.isSelected), [responses]);

  return { sortKey, setSortKey, rows, anySelected };
}
