import { useEffect, useState } from "react";

/**
 * Where "a phone" ends and "a tablet" begins, for layouts that can't be
 * expressed with a breakpoint class and have to be decided in JS.
 *
 * 47.99rem rather than 48rem so it stops exactly where Tailwind's `md` starts:
 * a portrait iPad (768px) is on the tablet side of this line, and everything
 * narrower is a phone. Written once here because two screens now branch on it —
 * the login page, which drops the whole marketing page below it, and the steps
 * deck. They have to agree.
 */
export const MOBILE_QUERY = "(max-width: 47.99rem)";

/**
 * Subscribes to a media query and re-renders when it flips.
 *
 * Seeded synchronously from `matchMedia` rather than from `false` + an effect,
 * so the first paint is already the right layout — a component that branches on
 * this never flashes the desktop tree on a phone.
 */
export function useMatchMedia(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    /* Called once up front: the query can have flipped between the initial
       state and this effect running. */
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}
