import { useMemo } from 'react';
import { useProfilePhoto } from '@/features/profile/hooks/useProfilePhoto';
import { useProfileRecord } from '@/features/profile/hooks/useProfileRecord';

/**
 * The four fields off `/posp/me` that end up printed on a card.
 *
 * A narrowing rather than a fetch of its own — `useProfileRecord` already owns
 * the call and the store dedupes, so asking for this costs nothing extra once
 * the profile page or the sign-in path has loaded it.
 *
 * ⚠ CALL IT ONCE PER GRID AND PASS THE RESULT DOWN, never once per card. Every
 * card would get the same answer, and each one running its own
 * `ensurePospProfile` effect and its own portrait fetch adds a dozen redundant
 * effects to a grid that remounts on every category tap. That is this hook's
 * contract, so `BannerGrid` states it and the cards do not restate it.
 *
 * Returns null — meaning "this agent has no card to stamp" — in two cases, and
 * they are deliberately the same case to the caller:
 *
 *   1. The profile has not arrived yet. Offering a button that would fail is
 *      worse than one that appears a moment later.
 *   2. There is no POSP code. `/posp/me` is REGISTERED-only and answers 403 to
 *      an ONBOARDING token, and `pospCode` is null until the back office
 *      allocates one even for an agent who can read it. Either way there is no
 *      identity to print, and a footer with a blank ID line is worse than no
 *      footer at all.
 *
 * The brochure half of the module never calls this: a brochure is published as
 * it is and carries none of the agent's details, so it downloads for everyone
 * including agents still in onboarding.
 */
export function useAgentFooter() {
  const { profile } = useProfileRecord();

  /* The portrait as a `blob:` URL rather than a path — `profileImagePath` is a
   * document key behind an authenticated route, so the bytes have to come
   * through the axios client before a canvas can draw them. `useProfilePhoto`
   * owns that dance and resolves to null if it fails, which the footer handles
   * by drawing initials instead. */
  const photoUrl = useProfilePhoto(profile?.profileImagePath);

  return useMemo(() => {
    if (!profile?.pospCode) return null;

    return {
      name: profile.fullName,
      pospCode: profile.pospCode,
      mobile: profile.mobile,
      photoUrl,
    };
  }, [profile, photoUrl]);
}
