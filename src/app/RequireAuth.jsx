import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/authStore';

/**
 * Route guard for everything behind sign-in. If the POSP isn't authenticated,
 * bounce them to the login page; otherwise render the protected page.
 *
 * Subscribes to the store (not the hook-free helper) so the guard re-renders
 * the moment `signIn()` flips the flag — no manual reload needed. This wraps
 * both the onboarding wizard and (alongside RequireOnboarding) the dashboard.
 */
export default function RequireAuth({ children }) {
  const authenticated = useAuthStore((s) => s.authenticated);

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
