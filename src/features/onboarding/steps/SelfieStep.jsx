import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, ShieldCheck, Upload, RotateCcw, Check, UserRound, AlertCircle } from "lucide-react";
import Button from "@/shared/components/Button";

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

  // Seed from a previously captured selfie (e.g. when editing from Review).
  const [photo, setPhoto] = useState(() =>
    initialValues?.selfie
      ? { url: URL.createObjectURL(initialValues.selfie), file: initialValues.selfie }
      : null
  ); // { url, file }
  const [live, setLive] = useState(false);  // camera preview running
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
      setPhoto({ url: URL.createObjectURL(blob), file });
      stopCamera();
    }, "image/jpeg", 0.92);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    stopCamera();
    setPhoto({ url: URL.createObjectURL(file), file });
  };

  const retake = () => {
    if (photo?.url) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    setError(null);
  };

  const submit = () => {
    if (!photo) return;
    onNext?.({ selfie: photo.file });
  };

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-7 pb-5 sm:pb-6 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <Camera size={13} strokeWidth={2.5} />
          Step 4 · Selfie Verification
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          Add a selfie
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          A clear, front-facing photo helps us confirm it's really you.
        </p>
      </div>

      <div className="px-5 sm:px-8 py-7 sm:py-8 flex flex-col items-center gap-6">

        {/* ── Circular stage ── */}
        <div className="relative h-56 w-56 sm:h-64 sm:w-64">
          {/* Soft glow ring */}
          <div className="absolute -inset-2 rounded-full bg-linear-to-br from-orange-200/40 to-rose-200/30 blur-xl" />

          <div className="relative h-full w-full rounded-full border-4 border-white shadow-[0_8px_28px_rgba(222,123,61,0.18)] overflow-hidden bg-slate-50 ring-1 ring-slate-100">
            {photo ? (
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
          {photo && (
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
          <p className="anim-fade -mt-2 flex items-center gap-1.5 text-[13px] font-medium text-red-500 text-center" role="alert">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </p>
        )}

        {/* Hidden file input shared by the upload buttons */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
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
              <Button type="button" onClick={capture} className="flex-1 flex items-center justify-center gap-2">
                <Camera size={16} strokeWidth={2.5} /> Capture
              </Button>
            </div>
          ) : photo ? (
            /* Photo taken → retake / confirm */
            <div className="anim-fade flex gap-3">
              <button
                type="button"
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 px-4 font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
              >
                <RotateCcw size={16} strokeWidth={2.5} /> Retake
              </button>
              <Button type="button" onClick={submit} className="flex-1 flex items-center justify-center gap-2">
                <Check size={16} strokeWidth={2.5} /> Use this photo
              </Button>
            </div>
          ) : (
            /* Idle → choose a source */
            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="button" onClick={startCamera} className="flex-1 flex items-center justify-center gap-2">
                <Camera size={16} strokeWidth={2.5} /> Take photo now
              </Button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 px-4 font-semibold text-slate-600 transition-all duration-200 hover:border-orange-200 hover:bg-orange-50/40 hover:text-orange-600 active:scale-[0.98]"
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
