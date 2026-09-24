import { useEffect, useRef } from 'react';

/**
 * A ref that is true while this component is mounted.
 *
 * For the one guard this module keeps needing: an async action the agent
 * started — preparing a card, downloading a brochure — that settles after the
 * grid has already remounted under them. Every category tap remounts it, so
 * this is a normal event rather than an edge case, and without the guard the
 * work lands as a setState on a component that is gone.
 *
 * Distinct from the `let live = true` inside `useCategories` and
 * `useCategoryItems`, and deliberately not merged with it. Those cancel per
 * *effect run* — a second category's request must be able to invalidate the
 * first while the component stays mounted. This one cancels per *mount*, which
 * is what an action fired from an event handler needs, since there is no effect
 * whose cleanup could carry it.
 *
 * Reassigned to true on mount rather than trusting the initial value, because
 * StrictMode mounts, cleans up and mounts again — the second mount would
 * otherwise start out already marked dead.
 */
export function useMounted() {
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  return mounted;
}
