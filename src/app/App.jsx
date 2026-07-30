import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OverviewPage from '@/features/overview/pages/OverviewPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import TrainingPage from '@/features/posp-training/pages/TrainingPage';
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
        {/* Entry point — send the visitor to whichever stage of the funnel they're at. */}
        <Route path="/" element={<Navigate to={landingPath()} replace />} />

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Signed in, but onboarding may still be pending */}
        <Route
          path="/onboarding"
          element={<RequireAuth><OnboardingScreen /></RequireAuth>}
        />

        {/* Dashboard — signed in *and* onboarded */}
        <Route
          path="/overview"
          element={<RequireAuth><RequireOnboarding><OverviewPage /></RequireOnboarding></RequireAuth>}
        />
        <Route
          path="/profile"
          element={<RequireAuth><RequireOnboarding><ProfilePage /></RequireOnboarding></RequireAuth>}
        />
        <Route
          path="/posp-training"
          element={<RequireAuth><RequireOnboarding><TrainingPage /></RequireOnboarding></RequireAuth>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
