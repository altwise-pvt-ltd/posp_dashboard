import { create } from 'zustand';

/**
 * Factory for the funnel's on/off stage flags.
 *
 * Onboarding and training are the same store written twice: a boolean in
 * localStorage, seeded on mount, flipped by one action, read by a route guard.
 * Only the storage key differs, so the shape lives here once and each store
 * becomes the handful of lines that name it.
 *
 * The state is deliberately generic — `value`, not `complete` or `certified` —
 * because the naming belongs on the exported helpers, where callers read it.
 * The guard reads `s.value` for every stage and doesn't need to know which flag
 * it is looking at.
 *
 * Verification is NOT built on this: it carries a three-way status and the
 * reasons a profile was sent back, which a boolean can't hold.
 */
export function createFlagStore(storageKey) {
  // Wrapped in try/catch because localStorage can throw in private-mode /
  // SSR-ish contexts; default to "not done" if so, which only ever holds a user
  // back rather than letting them skip a stage.
  const read = () => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  };

  const write = (value) => {
    try {
      localStorage.setItem(storageKey, value ? 'true' : 'false');
    } catch {
      // Ignore — the in-memory store state still updates below.
    }
  };

  return create((set) => ({
    // Seed from localStorage so a returning user keeps the stages they cleared.
    value: read(),
    setValue: (value) => {
      write(value);
      set({ value });
    },
  }));
}
