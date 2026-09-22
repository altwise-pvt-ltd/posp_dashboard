import { useMemo } from 'react';
import { MOCK_POLICIES } from '../data/mockPolicies';

/**
 * The policy rows, and the one clock every date question is asked against.
 *
 * ⚠ The single point where this module becomes real. `loadPolicies` below is
 * the seam — when a policy list endpoint exists, that function becomes the
 * request and everything above it is unchanged, because every consumer already
 * works on a plain array. Nothing outside this file imports the mock.
 *
 * It was extracted out of `usePolicyList` once Overview's chart needed the same
 * rows. Two hooks each calling their own loader would have been two swap points
 * to remember and two chances for the dashboard's pages to disagree about what
 * the agent has sold. There is one loader, and both hooks sit on it.
 *
 * `loading` and `error` are part of the returned shape from the start, even
 * though a synchronous array can never be either. They exist so screens render
 * their waiting and failure states today rather than having them grafted on
 * later, when the difference between "no policies" and "the request failed"
 * stops being hypothetical.
 */

/** ⚠ Swap point — see the note above. Replace the body, keep the signature. */
const loadPolicies = () => MOCK_POLICIES;

export function usePolicies() {
  /**
   * The rows and the clock are produced together, in one memo, because the
   * clock belongs to the data: "expiring within 30 days" is a claim about
   * these rows as of the moment they were read. Every consumer — the chip
   * counts, the filter, the summary tiles, the sort comparator, the trend —
   * takes this same instant. Letting each reach for its own `new Date()` means
   * a render straddling midnight can count a policy in a tile and then filter
   * it out of the list underneath, and gives a comparator two different
   * "todays" inside a single sort.
   *
   * When `loadPolicies` becomes a request, both fields are set from its reply,
   * so the clock refreshes with the data rather than being frozen at mount.
   */
  const { policies, now } = useMemo(
    () => ({ policies: loadPolicies(), now: new Date() }),
    []
  );

  return {
    policies,
    now,
    loading: false,
    error: null,
    // A no-op against the mock. Returned now so an error state already has
    // something to call when `loadPolicies` becomes a request.
    retry: () => {},
  };
}
