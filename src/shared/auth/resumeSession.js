import { AUTH_FLOW } from '@/features/auth/api/authApi';
import { describeFlow, verdictFrom } from '@/shared/status/pospStatus';
import { markCertified } from '@/shared/store/certificationStore';
import { completeOnboarding, resetOnboarding } from '@/shared/store/onboardingStore';
import { refreshOnboardingStatus } from '@/shared/store/onboardingStatusStore';
import {
  refreshPospProfile,
  applyVerificationVerdict,
} from '@/shared/store/pospProfileStore';
import { markTrainingEnrolled } from '@/shared/store/trainingPlanStore';
import { acknowledgeVerification, VERIFICATION } from '@/shared/store/verificationStore';

/**
 * Sets the funnel flags from the verify-OTP reply, before `landingPath()` reads
 * them. Never rejects — the refreshes resolve to null on failure.
 */
export async function resumeSession(session = {}) {
  if (session.flow === AUTH_FLOW.REGISTERED) {
    // REGISTERED is itself the statement that the wizard is behind them.
    completeOnboarding();

    // `overallStatus` is the source, not a fallback — one field, one call.
    applyVerificationVerdict(verdictFrom({ overallStatus: session.overallStatus }));

    const flow = describeFlow(session.overallStatus);

    // Must follow the verdict write above, which clears the ack flag.
    if (flow.enrolled) {
      acknowledgeVerification();
    }

    if (flow.certified) {
      markCertified();
    }

    // ⚠ Gated on `!hoursSettled` — the stamp it writes is *now*, which on a
    // finished course would hide the exam behind a fresh countdown.
    if (flow.enrolled && !flow.hoursSettled) {
      markTrainingEnrolled();
    }

    // Not awaited: nothing downstream of sign-in reads it.
    refreshPospProfile();

    return;
  }

  // CORRECTION — the wizard reopened, so the verdict from the earlier
  // submission has to be undone or `landingPath()` sends them to
  // `/verification`. Only this branch touches the verdict; the wizard reset
  // below is the same for every flow that lands in it.
  if (session.flow === AUTH_FLOW.CORRECTION) {
    applyVerificationVerdict(VERIFICATION.REJECTED);
  }

  // CORRECTION, ONBOARDING, and anything unrecognised — defaulting to the
  // wizard is the safe direction. Clearing is safe because the refresh syncs
  // the flag back on.
  resetOnboarding();
  await refreshOnboardingStatus();
}
