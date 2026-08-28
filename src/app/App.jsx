import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OverviewPage from '@/features/overview/pages/OverviewPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import TrainingPage from '@/features/posp-training/pages/TrainingPage';
import OnboardingScreen from '@/features/onboarding/pages/OnboardingScreen';
import VerificationPendingPage from '@/features/verification/pages/VerificationPendingPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import AlertContainer from '@/shared/components/alert/AlertContainer';
import RequireFunnel from '@/app/RequireFunnel';
import { landingPath } from '@/app/funnel';

/**
 * Every protected route names the last stage that must be behind the user, and
 * RequireFunnel resolves the rest from `FUNNEL_STAGES`. The order lives in
 * app/funnel.js — don't re-encode it here.
 *
 * Routes render immediately, with no gate in front of them: the auth store
 * seeds itself synchronously from storage (see `shared/auth/storedSession.js`),
 * so `landingPath()` and every `RequireFunnel` below have a real answer on the
 * first render rather than a pending one.
 */
function App() {
  return (
    <BrowserRouter>
      <AlertContainer />

      <Routes>
        {/* Entry point — send the visitor to whichever stage of the funnel they're at. */}
        <Route path="/" element={<Navigate to={landingPath()} replace />} />

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Signed in. No onboarding gate: the verification screen's breadcrumb
            links back here so a submitted user can review what they sent. */}
        <Route
          path="/onboarding"
          element={<RequireFunnel through="auth"><OnboardingScreen /></RequireFunnel>}
        />

        {/* Submitted, and the back office's answer whatever it turns out to be.
            The page renders all three verdicts, so a cleared POSP is *not*
            forwarded off it: they watch the screen flip to verified and go on
            via its own button. `landingPath()` keeps landing them here until
            they press it — an approval delivered to an empty room isn't
            delivered — and sends them straight to training afterwards. */}
        <Route
          path="/verification"
          element={
            <RequireFunnel through="onboarding">
              <VerificationPendingPage />
            </RequireFunnel>
          }
        />

        {/* Verified. Stays reachable after certification — the sidebar links
            here for a POSP who wants to revisit the material. */}
        <Route
          path="/posp-training"
          element={<RequireFunnel through="verification"><TrainingPage /></RequireFunnel>}
        />

        {/* Dashboard — the whole funnel behind them. */}
        <Route
          path="/overview"
          element={<RequireFunnel through="training"><OverviewPage /></RequireFunnel>}
        />
        <Route
          path="/profile"
          element={<RequireFunnel through="training"><ProfilePage /></RequireFunnel>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
