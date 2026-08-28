import { useCallback, useEffect } from 'react';
import { ensurePospProfile, usePospProfileStore } from '@/shared/store/pospProfileStore';

/**
 * The `/posp/me` record, for the screens that render it.
 *
 * `ensureLoaded` rather than `refresh`, so a profile the sign-in path already
 * fetched isn't paid for a second time on mount — and because the store dedupes
 * against its own in-flight call, the four cards mounting together join one
 * request instead of starting four.
 *
 * Selectors are subscribed field by field. A single `(s) => s` would re-render
 * every card on any store write, including the `loading` flip that happens
 * twice per refresh.
 */
export function useProfileRecord() {
  const profile = usePospProfileStore((state) => state.profile);
  const loading = usePospProfileStore((state) => state.loading);
  const error = usePospProfileStore((state) => state.error);
  const refresh = usePospProfileStore((state) => state.refresh);

  useEffect(() => {
    ensurePospProfile();
  }, []);

  /* Wrapped so an onClick's event object can't reach `refresh` as an argument. */
  const retry = useCallback(() => refresh(), [refresh]);

  return { profile, loading, error, retry };
}
