import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OverviewPage from '@/features/overview/pages/OverviewPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import OnboardingScreen from '@/features/onboarding/pages/OnboardingScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingScreen />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
