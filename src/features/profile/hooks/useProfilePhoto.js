import { useEffect, useState } from 'react';
import { fetchDocumentBlob } from '@/features/onboarding/api/onboardingApi';

/**
 * The POSP's photograph as something an `<img src>` can take.
 *
 * `profileImagePath` is a document *key*, not a URL, and the route behind it is
 * authenticated — the browser sends no Authorization header on an image
 * request, so the bytes have to come through the axios client and become an
 * object URL. Same dance `useCertificate` and `ReviewStep` do.
 *
 * Failure is swallowed and reported as `null`: a photo that doesn't load costs
 * the card its portrait, and the caller falls back to initials. There is no
 * error state worth surfacing for it — the rest of the card is still true.
 *
 * The object URL is revoked on the way out, since it pins the blob in memory
 * until it is.
 */
export function useProfilePhoto(key) {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
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
        /* Deliberately silent — see above. */
      });

    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPhoto(null);
    };
  }, [key]);

  return photo;
}
