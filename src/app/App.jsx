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
        <Route path="/" element={<OnboardingScreen />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/posp-training" element={<TrainingPage />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
