import { useMemo } from 'react';
import { useProfilePhoto } from '@/features/profile/hooks/useProfilePhoto';
import { useProfileRecord } from '@/features/profile/hooks/useProfileRecord';

/**
 * The six fields off `/posp/me` that end up on a shared card.
 *
 * A narrowing rather than a fetch of its own — `useProfileRecord` already owns
 * the call, and the store dedupes, so the grid asking for this costs nothing
 * extra when the profile page or the sign-in path has already loaded it.
 *
 * Call it once per grid and pass the result down, not once per card. Every card
 * would get the same answer, and each one running its own `ensurePospProfile`
 * effect adds a dozen no-op effects to a category that remounts on every tap.
 * That is this hook's contract, so the call sites do not restate it.
 *
 * Wording and formatting of these fields live in `lib/agentSignature.js`, which
 * is what both the canvas strip and the share caption read.
 *
 * ⚠ Returns null for an agent still in onboarding: `/posp/me` is REGISTERED-only
 * and answers 403 to an ONBOARDING token, so `profile` never arrives. That is
 * the right outcome — an agent with no POSP code has no signature to stamp — and
 * the share falls back to the plain link rather than breaking.
 */
export function useAgentSignature() {
  const { profile } = useProfileRecord();

  /* The portrait, as a `blob:` URL rather than a path — `profileImagePath` is a
   * document key behind an authenticated route, so the bytes have to come
   * through the axios client before a canvas or an `<img>` can take them.
   * `useProfilePhoto` owns that, and resolves to null if the fetch fails.
   *
   * Called here rather than in the card, for the same reason the profile is:
   * once per grid, not once per tile. */
  const photo = useProfilePhoto(profile?.profileImagePath);

  return useMemo(() => {
    if (!profile) return null;

    const signature = {
      name: profile.fullName,
      mobile: profile.mobile,
      pospCode: profile.pospCode,
      rmName: profile.rmName,
      rmMobile: profile.rmMobile,
      supportMobile: profile.supportMobile,
    };

    /* Every field defaults to null in `normalizeProfile`, so a profile that
     * loaded but holds nothing useful is possible. Null here rather than an
     * object of nulls, so callers have one thing to check and an empty strip is
     * never drawn.
     *
     * `photo` is deliberately outside the test: a portrait with no name beside
     * it is not a signature, so it cannot be the thing that keeps one alive. */
    if (!Object.values(signature).some(Boolean)) return null;

    return { ...signature, photo };
  }, [profile, photo]);
}
