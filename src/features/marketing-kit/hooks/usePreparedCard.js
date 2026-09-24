import { useCallback, useEffect, useRef, useState } from 'react';
import { composeBrandedCard } from '../lib/brandFooter';
import { useMounted } from './useMounted';

/**
 * One card's branded copy: build it, hold it, hand it back.
 *
 * The flow this serves is deliberately two-step. Tapping the button prepares
 * the file and *shows* it; saving is a second, separate decision made against
 * the real thing. An agent who can see their own name and POSP ID burned in
 * before anything leaves the app sends it without hesitating — which is the
 * whole reason there is a preview at all rather than a straight download.
 *
 *   idle ──prepare()──► preparing ──► ready ──dismiss()──► idle
 *                            └──────► failed ──prepare()──► preparing
 *
 * ONE BUILD PER CARD. The result is cached in a ref and reused, because
 * reopening the preview should not re-download a 3 MB original and redraw it.
 * The cache is keyed by nothing: this hook instance belongs to one card, and a
 * card whose artwork changed would have been remounted by the grid anyway.
 *
 * The object URL is revoked on unmount — it pins the blob in memory until it
 * is, and a grid of six cards each holding a prepared JPEG is real memory.
 */
export function usePreparedCard({ imageUrl, agent }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const [ready, setReady] = useState(null);

  /* The built file again, in a ref, so the two places that cannot read state
   * can still reach it: the unmount cleanup below, which would otherwise close
   * over whatever `ready` was on first render, and `prepare`'s cache check,
   * which would have to take `ready` as a dependency and be rebuilt every time
   * it changed. */
  const readyRef = useRef(null);

  /* Guards a build that lands after the card is gone — every category tap
   * remounts this grid, so that is routine rather than an edge case. */
  const mounted = useMounted();

  /* An object URL pins its blob in memory until it is revoked, and a category
     of six prepared cards is real memory. */
  useEffect(
    () => () => {
      if (readyRef.current) URL.revokeObjectURL(readyRef.current.url);
    },
    []
  );

  const prepare = useCallback(async () => {
    if (readyRef.current) {
      setStatus('ready');
      return;
    }

    setStatus('preparing');
    setError(null);

    try {
      const built = await composeBrandedCard({
        imageUrl,
        photoUrl: agent?.photoUrl,
        agent,
      });

      if (!mounted.current) {
        /* Nobody is going to revoke this but us — the cleanup has already run. */
        URL.revokeObjectURL(built.url);
        return;
      }

      readyRef.current = built;
      setReady(built);
      setStatus('ready');
    } catch (err) {
      if (!mounted.current) return;
      setError(err);
      setStatus('failed');
    }
  }, [imageUrl, agent, mounted]);

  /* Closes the preview without throwing the built file away — the agent may
     well reopen it, and the second time should be instant. */
  const dismiss = useCallback(() => setStatus('idle'), []);

  return { status, error, ready, prepare, dismiss };
}
