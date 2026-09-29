import { formatMobile } from '@/features/profile/lib/profileFields';

/**
 * What goes on a business card, and in what colours.
 *
 * ONE SOURCE FOR THE WORDS. The card is drawn twice — once as DOM
 * (`shared/components/BusinessCardFront`) for the screen, once onto a canvas
 * (`shared/lib/businessCardImage`) for the file the agent downloads. The two
 * renderers may keep their own coordinates, because a pixel that drifts is a
 * cosmetic bug the agent can see for themselves. What they must NOT keep
 * separately is the *content*: a preview whose name or POSP ID differs from
 * the saved file is the one failure the agent has no way to catch, and the
 * same warning is already written on `PreparedCardDialog`.
 *
 * So both sides call `businessCardFields` and neither reads the profile
 * record directly.
 */

/* Lifted from the Figma design (node 1212:972), and restated as literals here
   rather than read back off `--color-card-*` at runtime: the canvas has no
   element to resolve custom properties against, and a `getComputedStyle` dance
   to recover four fixed brand colours would be ceremony around a constant. */
export const CARD_PALETTE = {
  surface: '#f8f3ec',
  cream: '#efe5d7',
  ink: '#3a170d',
  accent: '#f56a13',
};

/** The print geometry. Everything else in both renderers is relative to it. */
export const CARD_WIDTH = 700;
export const CARD_HEIGHT = 400;

/** The brand half of the card — the same on every agent's. */
export const CARD_BRAND = {
  website: 'www.letsinsurance.com',
  scriptLine1: 'Protecting',
  scriptLine2: 'You and Yours',
};

/* City and state, not `composeAddress`. A card carries a place, not a postal
   address — the agent's flat number on a card they hand to a customer is both
   more than the customer needs and more than the agent may want to give. */
const placeOf = (profile) =>
  [profile?.city, profile?.state]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ') || null;

/**
 * Returns null when there is nothing to print — same contract, and the same
 * two reasons, as `marketing-kit/hooks/useAgentFooter`: no profile yet, or no
 * POSP code allocated. A card with a blank ID line is worse than no card.
 */
export function businessCardFields(profile) {
  if (!profile?.pospCode) return null;

  return {
    name: profile.fullName || null,
    pospId: profile.pospCode,
    phone: formatMobile(profile.mobile),
    email: profile.email || null,
    website: CARD_BRAND.website,
    location: placeOf(profile),
  };
}
