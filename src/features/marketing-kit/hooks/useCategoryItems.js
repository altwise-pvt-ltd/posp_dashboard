import { useCallback, useEffect, useState } from 'react';

/**
 * The items inside one category — banners or brochures, depending on the
 * fetcher handed in. Both calls take a `categoryId` and answer with the same
 * already-sorted, already-filtered array, so one hook covers them.
 *
 * Unlike `useCategories` this runs many times per mount — the agent taps
 * through the strip — and the shape here is built around that.
 *
 * One state object holding the `key` it was fetched for, rather than separate
 * `items` / `loading` / `error` values. Everything the caller reads is derived
 * from whether that key still matches what is being asked for, which buys three
 * things at once: no synchronous setState in the effect body (the cascading
 * render eslint rejects), no window where the previous category's artwork sits
 * under the new category's heading, and a `loading` that cannot drift out of
 * step with the data beside it.
 *
 * `live` is still needed on top of that. Tapping A then B races two requests,
 * and without the guard a slow A landing after B would write A's rows under B's
 * key. The cleanup runs before the next effect, so only the newest can write.
 *
 * A null `categoryId` is a legitimate state — the categories haven't loaded yet
 * — and reads as an empty, not-loading grid rather than a failed call.
 *
 * ⚠ If a filter parameter is ever added to these endpoints it has to join the
 * key below, or the grid will keep showing the previous filter's results — and
 * it has to be debounced by the caller first, since every distinct key is a
 * request.
 */
export function useCategoryItems(fetchItems, categoryId) {
  /* Bumped by `retry`, and part of the key: a retry has to look like a new
   * request even though nothing the user chose has changed. */
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState({ key: null, items: [], error: null });

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  /* JSON rather than a joined string, so the day a free-text parameter joins
   * this array it cannot collide with whichever separator was picked. */
  const key = categoryId ? JSON.stringify([categoryId, attempt]) : null;

  useEffect(() => {
    if (!key) return undefined;

    let live = true;

    fetchItems(categoryId)
      .then((data) => live && setSettled({ key, items: data, error: null }))
      /* An error settles the same way a success does — same key, empty rows —
       * so the grid never shows stale artwork beside a failure message. */
      .catch((err) => live && setSettled({ key, items: [], error: err }));

    return () => {
      live = false;
    };
  }, [key, fetchItems, categoryId]);

  const fresh = key !== null && settled.key === key;

  return {
    items: fresh ? settled.items : [],
    loading: key !== null && !fresh,
    error: fresh ? settled.error : null,
    retry,
  };
}
