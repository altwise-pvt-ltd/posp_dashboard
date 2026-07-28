import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OverviewPage from '@/features/overview/pages/OverviewPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import OnboardingScreen from '@/features/onboarding/pages/OnboardingScreen';
import LoginPage from '@/features/auth/pages/LoginPage';
import AlertContainer from '@/shared/components/alert/AlertContainer';
import RequireAuth from '@/app/RequireAuth';
import RequireOnboarding from '@/app/RequireOnboarding';
import { isAuthenticated } from '@/shared/store/authStore';
import { isOnboardingComplete } from '@/shared/store/onboardingStore';

// Entry funnel: sign in first, then finish onboarding, then the dashboard.
const landingPath = () => {
  if (!isAuthenticated()) return '/login';
  return isOnboardingComplete() ? '/overview' : '/onboarding';
};

function App() {
  return (
    <BrowserRouter>
      <AlertContainer />
      <Routes>
        {/* Entry point: route to the first unfinished gate in the funnel. */}
        <Route path="/" element={<Navigate to={landingPath()} replace />} />

        {/* Sign in — the public front door. */}
        <Route path="/login" element={<LoginPage />} />

        {/* Onboarding — requires sign-in, but not a completed wizard. */}
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingScreen />
            </RequireAuth>
          }
        />

        {/* Dashboard — requires sign-in AND completed onboarding. */}
        <Route
          path="/overview"
          element={
            <RequireAuth>
              <RequireOnboarding>
                <OverviewPage />
              </RequireOnboarding>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <RequireOnboarding>
                <ProfilePage />
              </RequireOnboarding>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
