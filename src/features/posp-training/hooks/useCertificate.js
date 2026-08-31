import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDocumentBlob } from '@/features/onboarding/api/onboardingApi';
import { ensurePospProfile, usePospProfileStore } from '@/shared/store/pospProfileStore';
import { ApiError } from '@/shared/api/ApiError';
import { formatAadhaar } from '@/shared/validation/aadhaarField';
import { fetchMyCertificate } from '../api/certificateApi';

/**
 * The certificate, ready to print — both halves of it.
 *
 * One sheet, two sources, and neither one is enough on its own:
 *
 *   /certificates/me — the certificate. Its number, when it was issued, when it
 *                      lapses. Nothing about who holds it.
 *   /posp/me         — the holder. Name, PAN, Aadhaar, photograph. Nothing
 *                      about the certificate.
 *
 * This is what replaced `DEMO_HOLDER`, the fictional record the screen used to
 * print — a real name, a real PAN and a real Aadhaar belonging to nobody, on a
 * document that says at the bottom that it is electronically verified. A
 * placeholder is harmless on a dashboard tile and is not harmless here, which is
 * why there is no fallback below: if either call fails the screen says so rather
 * than printing a certificate in somebody else's name.
 *
 * Returns `issued: false` for the one failure that isn't one — a pass recorded
 * before the server has generated the document. See `fetchMyCertificate`.
 *
 * The profile comes through `ensurePospProfile`, so this usually costs one round
 * trip rather than two: the sign-in path has already asked for it and the store
 * dedupes against that request.
 */
export function useCertificate() {
  const [certificate, setCertificate] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * The holder's photograph, as an object URL.
   *
   * Held apart from the two records above because it is fetched apart from them
   * — see the second effect. `null` is a perfectly good answer: `PospCertificate`
   * draws its placeholder silhouette in the frame, which is a better sheet than
   * one held back for a picture.
   */
  const [photo, setPhoto] = useState(null);

  /**
   * Both calls at once — they need nothing from each other, and the sheet needs
   * both, so running them in sequence would only make the screen slower to
   * settle by exactly one round trip.
   *
   * `isLive` is how the mount path and the retry path share one body, the same
   * arrangement `useCourseMaterial` uses: the effect passes a guard that goes
   * false on unmount, the retry button passes nothing and always applies its
   * answer.
   */
  const load = useCallback(
    (isLive = () => true) =>
      Promise.all([fetchMyCertificate(), ensurePospProfile()])
        .then(([issued, record]) => {
          if (!isLive()) return;

          /* `ensureLoaded` resolves to null rather than rejecting, so the reason
             is on the store — the same turn-it-back-into-a-throw that
             `loadTrainingRecord` makes. Without this the screen would report "no
             certificate" for what is actually a failed profile call. Thrown
             rather than set, so it lands in the one `catch` below. */
          if (!record) {
            throw (
              usePospProfileStore.getState().error ??
              new ApiError({ message: 'Could not load your POSP record. Please try again.' })
            );
          }

          setCertificate(issued);
          setProfile(record);
          setError(null);
        })
        .catch((err) => {
          if (!isLive()) return;
          /* Cleared, not kept. A half-drawn certificate under an error message
             is the one thing this screen must never show. */
          setCertificate(null);
          setProfile(null);
          setError(err);
        })
        .finally(() => {
          if (isLive()) setLoading(false);
        }),
    []
  );

  useEffect(() => {
    let live = true;
    load(() => live);

    return () => {
      live = false;
    };
  }, [load]);

  /**
   * The photograph, fetched separately and best effort.
   *
   * `profileImagePath` is a document *key*, not a URL, and the route behind it
   * is authenticated — the browser sends no Authorization header on an
   * `<img src>`, so the bytes have to come through the axios client and become
   * an object URL. Same dance `ReviewStep` does for its thumbnails.
   *
   * Deliberately not part of `load`: a failure here costs the sheet its photo,
   * and must not cost it the certificate. There is no error state for it.
   *
   * The URL is revoked on the way out — an object URL holds the blob in memory
   * until it is, and this screen is one a POSP may open and close repeatedly.
   */
  useEffect(() => {
    const key = profile?.profileImagePath;
    if (!key) return undefined;

    let live = true;
    let objectUrl = null;

    fetchDocumentBlob(key)
      .then((blob) => {
        if (!live) return;
        objectUrl = URL.createObjectURL(blob);
        setPhoto(objectUrl);
      })
      .catch(() => {
        /* Swallowed on purpose — see above. The frame falls back to its
           placeholder silhouette. */
      });

    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPhoto(null);
    };
  }, [profile?.profileImagePath]);

  /**
   * The holder as `PospCertificate` prints them.
   *
   * Built only when both records are in hand — a holder assembled from half the
   * data would print a sheet with blank identity fields, which is worse than no
   * sheet.
   *
   * `registrationNumber` prefers the certificate's own number over the POSP
   * code. The label on the document reads "POSP Reg. Number" and the two are
   * plausible readings of it, but this screen exists to show *the certificate*,
   * and `pospCode` is the fallback for a record issued before the number was
   * allocated.
   */
  const holder = useMemo(() => {
    if (!certificate || !profile) return null;

    return {
      name: profile.fullName ?? '',
      pan: profile.pancardNumber ?? '',
      aadhaar: formatAadhaar(profile.aadhaarNumber),
      registrationNumber: certificate.number ?? profile.pospCode ?? '',
      photo,
    };
  }, [certificate, profile, photo]);

  /* Wrapped rather than passed straight through: an onClick hands its event to
     the first argument, and `load` would call that event as the liveness
     guard. */
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    return load();
  }, [load]);

  return {
    certificate,
    holder,
    /** Settled, no error, and the server has no certificate for them *yet*. */
    issued: Boolean(certificate),
    issuedOn: certificate?.issuedAt ? new Date(certificate.issuedAt) : null,
    loading,
    error,
    retry,
  };
}
