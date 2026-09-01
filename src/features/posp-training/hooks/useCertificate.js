import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCertificateFile, fetchMyCertificate } from '../api/certificateApi';

/**
 * The certificate, and the document the server rendered for it.
 *
 * One source now, not two. This used to join `/certificates/me` with `/posp/me`
 * and a photograph blob, because the app drew the sheet itself and needed the
 * holder's name, PAN, Aadhaar and picture to print on it. The sheet comes from
 * the backend as a finished file, so none of that is this screen's business any
 * more — the identity is already on the document.
 *
 * Two calls remain, and the second depends on the first: the record names the
 * file, `fetchCertificateFile` resolves it to something a frame can take.
 *
 * Three settled outcomes the caller has to tell apart:
 *   no certificate  — a 404; the pass is recorded, the record isn't cut yet
 *   no file         — a record whose `certificateUrl` is empty; the document
 *                     hasn't been rendered yet
 *   file            — the certificate, ready to show
 *
 * The middle one is why `issued` and `file` are returned separately. Both are
 * "nothing to frame", and neither is an error.
 */
export function useCertificate() {
  const [certificate, setCertificate] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * The object URL currently on screen, if the file came through the API client.
   *
   * Held in a ref rather than derived from `file`, because releasing it is a
   * cleanup that has to run on paths where `file` is being replaced by a
   * different value — and on unmount, where there is no render left to read it.
   */
  const revokeRef = useRef(null);

  const release = useCallback(() => {
    revokeRef.current?.();
    revokeRef.current = null;
  }, []);

  const load = useCallback(
    (isLive = () => true) =>
      fetchMyCertificate()
        .then(async (issued) => [issued, issued?.fileUrl ? await fetchCertificateFile(issued.fileUrl) : null])
        .then(([issued, resolved]) => {
          /* Unmounted mid-flight: the object URL was still created, so it is
             released here rather than leaked to a component that will never
             render it. */
          if (!isLive()) {
            resolved?.revoke?.();
            return;
          }

          release();
          revokeRef.current = resolved?.revoke ?? null;

          setCertificate(issued);
          setFile(resolved);
          setError(null);
        })
        .catch((err) => {
          if (!isLive()) return;

          /* Cleared, not kept. A half-drawn certificate under an error message
             is the one thing this screen must never show. */
          release();
          setCertificate(null);
          setFile(null);
          setError(err);
        })
        .finally(() => {
          if (isLive()) setLoading(false);
        }),
    [release]
  );

  useEffect(() => {
    let live = true;
    load(() => live);

    return () => {
      live = false;
    };
  }, [load]);

  useEffect(() => release, [release]);

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
    /** `{ src, kind }` — `kind` is 'pdf' or 'image', and picks the element. */
    file,
    /** Settled, no error, and the server has no certificate for them *yet*. */
    issued: Boolean(certificate),
    loading,
    error,
    retry,
  };
}
