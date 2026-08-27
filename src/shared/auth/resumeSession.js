import { AUTH_FLOW } from '@/features/auth/api/authApi';
import { deriveVerification, isUnderTraining } from '@/features/profile/api/pospApi';
import { completeOnboarding, resetOnboarding } from '@/shared/store/onboardingStore';
import { refreshOnboardingStatus } from '@/shared/store/onboardingStatusStore';
import {
  refreshPospProfile,
  applyVerificationVerdict,
} from '@/shared/store/pospProfileStore';
import { markTrainingEnrolled } from '@/shared/store/trainingPlanStore';
import { acknowledgeVerification, VERIFICATION } from '@/shared/store/verificationStore';

/**
 * What happens between "the OTP was accepted" and "the user is looking at a
 * page": one server call to find out where they actually stand, and the funnel
 * flags set from its answer.
 *
 * It lives here rather than in the login page because the page's job ends at
 * `navigate(landingPath())` — this is the part that has to be true *before*
 * that line runs, and it is the part a future boot-time or refresh-token path
 * would need to repeat verbatim.
 *
 * ── Why a branch and not one call ─────────────────────────────────────────
 *
 * The sign-in path used to ask `GET /onboarding/status` unconditionally,
 * because there was only ever one kind of user to be: someone partway through
 * the wizard. `flow` on the verify reply says that is no longer true.
 *
 * A registered POSP still *has* an application row, so the status call would
 * happily answer for them — with a step index for a form that was submitted
 * weeks ago. That is the failure this branch exists to prevent: not a crash, an
 * answer to the wrong question, which routes someone who finished back into the
 * wizard at whatever step the row happens to hold.
 *
 * Two of the three flows end at the same call. `CORRECTION` is not a third
 * question — it asks `/onboarding/status`, exactly as `ONBOARDING` does. What
 * separates it is everything it has to *undo* first: a corrected application is
 * one that was already submitted, so the browser's own flags describe a stage
 * this POSP has been pulled back out of.
 *
 * Never rejects. The underlying refreshes resolve to null on failure, and the
 * rule is the same either way: a sign-in that worked must not be undone by a
 * follow-up call that didn't. The worst case is a POSP who lands one stage
 * earlier than they should and moves on as soon as the screen's own retry
 * succeeds.
 *
 * On the REGISTERED path there is now no such worst case for verification: the
 * verdict is read off the verify reply itself, so there is no request between
 * sign-in and the funnel flag that could fail.
 */
export async function resumeSession(session = {}) {
  if (session.flow === AUTH_FLOW.REGISTERED) {
    /**
     * REGISTERED is itself the statement that the wizard is behind them — the
     * server would not have issued a POSP record otherwise — so the flag is set
     * from the flow rather than waiting on the profile call. It also has to be
     * set *before* the await: `landingPath()` reads it, and a profile request
     * that hangs or fails would otherwise leave a fully registered POSP being
     * routed to /onboarding.
     */
    completeOnboarding();

    /**
     * The verification verdict, from the reply that just arrived.
     *
     * `overallStatus` is the source, not a fallback: it is the server's own
     * word on where this POSP sits in the funnel — `UNDER_VERIFICATION` while
     * a reviewer has them, `VERIFIED_UNDER_TRAINING` once they are cleared —
     * and it is already in hand at this line. Reading it here rather than from
     * `GET /posp/me` means the funnel is set from one field on one call, with
     * no second request to fail and no second copy to disagree.
     *
     * Set synchronously, before anything is awaited: `landingPath()` runs on
     * the next line of the login handler, and a verdict applied after it would
     * route this POSP off a stale flag.
     */
    applyVerificationVerdict(
      deriveVerification({ overallStatus: session.overallStatus })
    );

    /**
     * `VERIFIED_UNDER_TRAINING` — cleared *and* already enrolled. The stage
     * above is not merely passed, it is two steps behind them, and both of the
     * flags that say so have to be set here.
     *
     * The acknowledgement first. Every verdict write clears it, deliberately —
     * a fresh decision is one the POSP has not seen. But this decision is not
     * fresh: the server is telling us they were approved, read it, pressed on,
     * and enrolled, all before this sign-in. Leaving the flag down would send a
     * POSP who is mid-course back to be congratulated on their approval, on
     * every new tab. Set after the verdict, never before, since that is the call
     * that clears it.
     *
     * Then the plan. This one is a no-op in the ordinary case — a plan that
     * still has its `startedAt` is left exactly as it is — and only matters when
     * the local copy lost the stamp but kept the choice. See `markEnrolled`.
     *
     * ⚠ What this still cannot do is recreate a plan that is gone entirely.
     * `overallStatus` says *that* they are enrolled, not which line they picked
     * or how many hours it carries, and no endpoint exposes it yet; a POSP whose
     * localStorage was cleared is still asked to choose again. That is the
     * remaining half of this bug and it needs a server answer, not a local one.
     */
    if (isUnderTraining(session.overallStatus)) {
      acknowledgeVerification();
      markTrainingEnrolled();
    }

    /**
     * The profile is still fetched, because the profile screens render off it
     * — but it is deliberately *not* awaited any more. Nothing downstream of
     * sign-in reads it, so awaiting only held the "Verify" button spinning for
     * a round trip nobody was waiting on. `refresh()` never rejects and dedupes
     * against its own in-flight call, so a screen that mounts mid-flight joins
     * this request rather than starting a second one.
     */
    refreshPospProfile();

    return;
  }

  /**
   * CORRECTION — a reviewer sent the application back and reopened it.
   *
   * The same call as ONBOARDING, because it *is* the wizard again, but the local
   * flags have to be undone first. This POSP submitted once, so their browser is
   * holding `onboardingComplete` from that submission, and a stale `verified` if
   * they were ever cleared. Left alone, `landingPath()` would read the finished
   * application and route them to `/verification` — a waiting screen for an
   * application that is sitting open, waiting on them.
   *
   * The verdict is set to REJECTED rather than derived from `overallStatus`: the
   * flow field is itself the statement that the profile was sent back, and it is
   * the more specific of the two signals. It arrives with no reasons attached —
   * see the note in `applyVerificationVerdict`.
   */
  if (session.flow === AUTH_FLOW.CORRECTION) {
    resetOnboarding();
    applyVerificationVerdict(VERIFICATION.REJECTED);

    await refreshOnboardingStatus();
    return;
  }

  /**
   * ONBOARDING, and anything unrecognised.
   *
   * Defaulting an unknown `flow` to the wizard is the safe direction: it asks a
   * finished POSP to look at a form they can leave via the funnel, where the
   * opposite mistake — treating an unknown flow as REGISTERED — would mark the
   * wizard complete for someone who never filled it in and strand them on a
   * waiting screen for a profile that does not exist. It also means an older
   * server that sends no `flow` at all behaves exactly as it did before.
   */
  await refreshOnboardingStatus();
}
