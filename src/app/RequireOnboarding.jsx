import { Navigate } from 'react-router-dom';
import { useOnboardingStore } from '@/shared/store/onboardingStore';

/**
 * Route guard for dashboard pages. If the POSP hasn't finished onboarding,
 * bounce them into the wizard; otherwise render the protected page.
 *
 * Subscribes to the store (not the hook-free helper) so the guard re-renders
 * the moment `completeOnboarding()` flips the flag — no manual reload needed.
 */
export default function RequireOnboarding({ children }) {
  const complete = useOnboardingStore((s) => s.complete);

  if (!complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
