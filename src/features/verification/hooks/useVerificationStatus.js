import { useCallback, useEffect } from "react";
import {
  applyVerificationVerdict,
  usePospProfileStore,
} from "@/shared/store/pospProfileStore";
import { useVerificationStore, VERIFICATION } from "@/shared/store/verificationStore";

/**
 * The waiting screen's link to the server: fetch the POSP profile, adopt its
 * verdict, and keep asking while a reviewer still has it.
 *
 * Everywhere else the verification flag has one writer — `resumeSession`, off
 * the verify-otp reply. This screen is the deliberate exception, because
 * re-asking is the whole point of it; without this the verdict only ever
 * arrives on the next sign-in.
 */

const POLL_MS = 30_000;

/**
 * `deriveVerification` defaults to PENDING for anything it doesn't recognise,
 * which is wrong when the fields are simply absent — it would push a POSP the
 * verify reply already cleared back onto the waiting screen. So: no signals, no
 * write.
 */
const adopt = (profile) => {
  if (!profile || (!profile.status && !profile.kycStatus)) return;
  applyVerificationVerdict(profile.verification);
};

export function useVerificationStatus() {
  const status = useVerificationStore((s) => s.status);
  const loading = usePospProfileStore((s) => s.loading);
  const error = usePospProfileStore((s) => s.error);
  const profile = usePospProfileStore((s) => s.profile);

  const check = useCallback(
    () => usePospProfileStore.getState().refresh().then(adopt),
    [],
  );

  // `ensureLoaded`, not `refresh` — arriving from sign-in there is already a
  // call in flight for this profile, and this joins it.
  useEffect(() => {
    usePospProfileStore.getState().ensureLoaded().then(adopt);
  }, []);

  // Only PENDING polls: a verdict is the end of this screen's job. The
  // visibility check keeps a forgotten background tab quiet.
  useEffect(() => {
    if (status !== VERIFICATION.PENDING) return undefined;

    const id = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [status, check]);

  return { status, profile, loading, error, check };
}
