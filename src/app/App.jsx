import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/features/auth/pages/LoginPage';
import AlertContainer from '@/shared/components/alert/AlertContainer';
import RouteFallback from '@/shared/components/RouteFallback';
import RequireFunnel from '@/app/RequireFunnel';
import { landingPath } from '@/app/funnel';

const OnboardingScreen = lazy(() => import('@/features/onboarding/pages/OnboardingScreen'));
const VerificationPendingPage = lazy(() => import('@/features/verification/pages/VerificationPendingPage'));
const TrainingPage = lazy(() => import('@/features/posp-training/pages/TrainingPage'));
const OverviewPage = lazy(() => import('@/features/overview/pages/OverviewPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));

/**
 * Every protected route names the last stage that must be behind the user, and
 * RequireFunnel resolves the rest from `FUNNEL_STAGES`. The order lives in
 * app/funnel.js — don't re-encode it here.
 *
 * Routes render immediately, with no gate in front of them: the auth store
 * seeds itself synchronously from storage (see `shared/auth/storedSession.js`),
 * so `landingPath()` and every `RequireFunnel` below have a real answer on the
 * first render rather than a pending one.
 *
 * `/login` is the landing route and stays statically imported; the five behind
 * the funnel are `lazy` so none of their code sits in the bundle a first-time
 * visitor downloads. The single Suspense boundary lives outside `Routes` on
 * purpose — router navigations run inside a transition, so an existing boundary
 * holds the current screen while the next chunk arrives instead of flashing the
 * fallback.
 */
function App() {
  return (
    <BrowserRouter>
      <AlertContainer />

      <Suspense fallback={<RouteFallback />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
