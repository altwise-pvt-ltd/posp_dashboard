import { useMemo } from 'react';
import { usePolicies } from './usePolicies';
import { TREND_MONTHS, buildTrend } from '../lib/policyTrend';

/**
 * Premium booked per month, for a chart that only wants the trend.
 *
 * `usePolicyList` builds the same thing alongside its filtering and sorting;
 * this is the door in for a caller that needs none of that — Overview's chart,
 * which shows a shorter window and links through rather than answering the
 * question itself.
 *
 * Both sit on `usePolicies`, so the two charts are reading one set of rows
 * through one aggregation. That is the whole point of the split: Overview's
 * chart used to be hardcoded, and the failure mode being designed out is two
 * pages of the same dashboard quoting different numbers for the same months.
 */
export function usePolicyTrend(months = TREND_MONTHS) {
  const { policies, now, loading, error, retry } = usePolicies();

  const trend = useMemo(
    () => buildTrend(policies, now, months),
    [policies, now, months]
  );

  return { trend, loading, error, retry };
}
