import { Navigate } from 'react-router-dom';
import { FUNNEL_STAGES, landingPath } from '@/app/funnel';
import { useAuthStore } from '@/shared/store/authStore';
import { useOnboardingStore } from '@/shared/store/onboardingStore';
import { useVerificationStore, VERIFICATION } from '@/shared/store/verificationStore';
import { useTrainingStore } from '@/shared/store/trainingStore';

/**
 * The one route guard, for every stage of the funnel.
 *
 * Replaces the four near-identical RequireAuth / RequireOnboarding /
 * RequireVerification / RequireTraining components and the four-deep nesting
 * they forced on App.jsx. The stage order comes from `FUNNEL_STAGES`, the same
 * list `landingPath()` reads, so a route can no longer guard a different
 * sequence than the entry redirect sends people through.
 *
 *   through          — the last stage that must be clear. Every stage up to and
 *                      including it is checked, and the first unclear one wins:
 *                      an unverified user asking for the dashboard is sent to
 *                      verification, not bounced down one step at a time.
 *   forwardWhenClear — optional. If this stage is *already* clear the page has
 *                      nothing left to say, so send the user on to wherever
 *                      they actually belong. Currently unused: the verification
 *                      screen was its one caller, and it now renders its own
 *                      cleared state rather than being redirected off. Kept
 *                      because it's the right answer for any stage page that
 *                      genuinely has nothing to show once it's behind you.
 *
 * Subscribes to the stores rather than reading `isClear()` snapshots, so a
 * guard re-renders the moment a flag flips — a user watching the waiting screen
 * is let through the instant approval lands, with no reload.
 */
export default function RequireFunnel({ through, forwardWhenClear, children }) {
  // Every stage is read on every render: hooks must run unconditionally and in
  // a stable order, so these can't be looped over `FUNNEL_STAGES` or skipped
  // for the stages this particular route doesn't care about.
  const clear = {
    auth: useAuthStore((s) => s.authenticated),
    onboarding: useOnboardingStore((s) => s.value),
    verification: useVerificationStore((s) => s.status === VERIFICATION.VERIFIED),
    training: useTrainingStore((s) => s.value),
  };

  const upTo = FUNNEL_STAGES.findIndex((stage) => stage.id === through);
  if (upTo === -1) {
    // Loudly, rather than silently guarding nothing — an unrecognised stage id
    // would otherwise leave a protected page wide open.
    throw new Error(
      `RequireFunnel: unknown stage "${through}". Expected one of: ${FUNNEL_STAGES.map((s) => s.id).join(', ')}`
    );
  }

  const blocked = FUNNEL_STAGES.slice(0, upTo + 1).find((stage) => !clear[stage.id]);
  if (blocked) {
    return <Navigate to={blocked.path} replace />;
  }

  if (forwardWhenClear && clear[forwardWhenClear]) {
    return <Navigate to={landingPath()} replace />;
  }

  return children;
}
