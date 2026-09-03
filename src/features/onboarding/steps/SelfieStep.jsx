import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Camera, ShieldCheck, Upload, RotateCcw, Check, UserRound, AlertCircle, Loader2 } from "lucide-react";
import CustomButton from "@/shared/components/CustomButton";
import { SELFIE, acceptAttribute } from "@/shared/upload/policy";
import { prepareFile } from "@/shared/upload/validate";
import { showAlert } from "@/shared/store/alertStore";
import { uploadSelfie } from "../api/onboardingApi";
import { useDocumentFiles } from "../hooks/useDocumentFiles";

/**
 * SelfieStep — capture a selfie live or upload one from the device.
 *
 * Deliberately flat: no sub-steps. The single circular stage swaps between
 * three states — idle (pick a source) → live (camera preview) → preview
 * (a photo exists) — and the action row below it changes to match.
 */
export default function SelfieStep({ onNext, initialValues }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  /** This sitting's photo, captured or uploaded. `{ url, file }` or null. */
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [live, setLive] = useState(false);  // camera preview running

  /**
   * The selfie already on file, so editing this step from Review doesn't make
   * the applicant re-take a photo the server is already holding.
   *
   * Derived into `photo` below rather than copied into state on arrival, which
   * would be a cascading render and would need a guard for a fetch landing
   * *after* a new photo was taken. The precedence says it outright instead:
   * whatever this sitting produced wins, and `retakenSinceStored` carries the
   * one thing precedence can't express — that the stored one was thrown away.
   */
  const storedFiles = useDocumentFiles({ selfie: initialValues?.selfieKey });
  const [retakenSinceStored, setRetakenSinceStored] = useState(false);

  const storedSelfie = storedFiles.selfie;
  const storedPhoto = useMemo(
    () => (storedSelfie ? { url: URL.createObjectURL(storedSelfie), file: storedSelfie } : null),
    [storedSelfie]
  );

  useEffect(() => {
    if (!storedPhoto) return undefined;
    return () => URL.revokeObjectURL(storedPhoto.url);
  }, [storedPhoto]);

  const photo = capturedPhoto ?? (retakenSinceStored ? null : storedPhoto);

  const [preparing, setPreparing] = useState(false); // validating / transcoding an upload
  const [error, setError] = useState(null);

  // Always release the camera when it stops being needed.
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]); // cleanup on unmount

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setLive(true);
      // Attach after the video element is mounted by the `live` render.
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setError("Couldn't access the camera. Check permissions, or upload a photo instead.");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    // Square crop from the centre of the frame.
    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    ctx.translate(side, 0);
    ctx.scale(-1, 1); // un-mirror so the saved photo isn't flipped
    ctx.drawImage(
      video,
      (video.videoWidth - side) / 2,
      (video.videoHeight - side) / 2,
      side, side, 0, 0, side, side
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      setCapturedPhoto({ url: URL.createObjectURL(blob), file });
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  /**
   * Uploads go through the same policy the document fields use.
   *
   * The old check here was `file.type.startsWith("image/")`, which trusts a
   * label the browser derives from the filename and admits anything renamed to
   * .jpg. Routing through prepareFile means the bytes are identified for real —
   * and, on the path that matters most here, an iPhone HEIC is transcoded to
   * JPEG before it lands, so the preview below actually renders it on a browser
   * that isn't Safari.
   */
  const handleUpload = async (e) => {
    const selected = e.target.files?.[0];
    // Cleared immediately so re-picking the same file after a rejection still
    // fires a change event.
    e.target.value = "";
    if (!selected) return;

    setError(null);
    setPreparing(true);
    const result = await prepareFile(selected, SELFIE);
    setPreparing(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    stopCamera();
    setCapturedPhoto((previous) => {
      if (previous?.url) URL.revokeObjectURL(previous.url);
      return { url: URL.createObjectURL(result.file), file: result.file };
    });
  };

  /* Clears both halves: dropping only the captured photo would fall straight
     back to the stored one, so "Retake" would appear to do nothing for anyone
     editing a selfie they had already uploaded. The stored object URL is owned
     by the memo above and revoked there, not here. */
  const retake = () => {
    if (capturedPhoto?.url) URL.revokeObjectURL(capturedPhoto.url);
    setCapturedPhoto(null);
    setRetakenSinceStored(true);
    setError(null);
  };

  const [uploading, setUploading] = useState(false);

  /**
   * Upload, then advance — only on success, so a failed upload leaves the photo
   * on screen to retry rather than moving on from a selfie the server never
   * got. This step has no react-hook-form instance to hang an error on, so the
   * failure goes to the inline `error` line the camera path already uses, and
   * to a toast for anyone whose eyes are on the photo rather than under it.
   */
  const submit = async () => {
    if (!photo) {
      showAlert({
        variant: "warning",
        title: "Selfie required",
        message: "Please capture or upload a selfie to continue.",
      });
      return;
    }

    setError(null);
    setUploading(true);
    try {
      await uploadSelfie(photo.file);
      onNext?.({ selfie: photo.file });
    } catch (uploadError) {
      setError(uploadError.message);
      showAlert({
        variant: uploadError.isValidation ? "warning" : "error",
        title: "Couldn't upload your selfie",
        message: uploadError.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-5 pb-4 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <Camera size={13} strokeWidth={2.5} />
          Step 4 · Selfie Verification
        </span>
        <h2 className="text-base sm:text-lg lg:text-[1.375rem] font-extrabold text-slate-800 tracking-tight">
          Add a selfie
        </h2>
        <p className="flex items-center gap-1.5 text-[0.625rem] sm:text-xs text-slate-500 mt-1 lg:mt-2">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          A clear, front-facing photo helps us confirm it's really you.
        </p>
      </div>

      <div className="px-4 sm:px-5 lg:px-6 py-5 flex flex-col items-center gap-4 sm:gap-5">

        {/* ── Circular stage ── */}
        <div className="relative h-48 w-48 sm:h-56 sm:w-56 lg:h-64 lg:w-64">
          {/* Soft glow ring */}
          <div className="absolute -inset-2 rounded-full bg-linear-to-br from-orange-200/40 to-rose-200/30 blur-xl" />

          <div className="relative h-full w-full rounded-full border-4 border-white shadow-[0_8px_28px_rgba(222,123,61,0.18)] overflow-hidden bg-slate-50 ring-1 ring-slate-100">
            {preparing ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 text-slate-400">
                <Loader2 size={40} strokeWidth={1.75} className="animate-spin text-orange-500" />
                <span className="text-xs font-medium">Preparing photo…</span>
              </div>
            ) : photo ? (
              <img key={photo.url} src={photo.url} alt="Your selfie" className="anim-photo h-full w-full object-cover" />
            ) : live ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover -scale-x-100" // mirror for a natural preview
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
                <UserRound size={64} strokeWidth={1.5} />
                <span className="text-xs font-medium text-slate-400">No photo yet</span>
              </div>
            )}
          </div>

          {/* Success ring flash + done badge */}
          {photo && !preparing && (
            <>
              <div key={`${photo.url}-flash`} className="anim-ring-flash pointer-events-none absolute -inset-1 rounded-full ring-4 ring-emerald-400/70" />
              <div className="anim-badge absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-white">
                <Check size={18} strokeWidth={3} />
              </div>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="anim-fade -mt-2 flex items-center gap-1.5 text-[0.8125rem] font-medium text-red-500 text-center" role="alert">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </p>
        )}

        {/* Hidden file input shared by the upload buttons */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttribute(SELFIE)}
          capture={SELFIE.capture}
          className="hidden"
          onChange={handleUpload}
        />

        {/* ── Action row — swaps with the stage state ── */}
        <div className="w-full">
          {live ? (
            /* Live camera → capture / cancel */
            <div className="anim-fade flex gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 px-4 font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
              >
                Cancel
              </button>
              <CustomButton type="button" onClick={capture} className="flex-1">
                <Camera size={16} strokeWidth={2.5} /> Capture
              </CustomButton>
            </div>
          ) : photo ? (
            /* Photo taken → retake / confirm */
            <div className="anim-fade flex gap-3">
              <button
                type="button"
                onClick={retake}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 px-4 font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={16} strokeWidth={2.5} /> Retake
              </button>
              <CustomButton
                type="button"
                onClick={submit}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} /> Use this photo
                  </>
                )}
              </CustomButton>
            </div>
          ) : (
            /* Idle → choose a source */
            <div className="flex flex-col sm:flex-row gap-3">
              <CustomButton
                type="button"
                onClick={startCamera}
                disabled={preparing}
                className="flex-1"
              >
                <Camera size={16} strokeWidth={2.5} /> Take photo now
              </CustomButton>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={preparing}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 px-4 font-semibold text-slate-600 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50/40 hover:text-orange-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} strokeWidth={2.5} /> Upload from device
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
