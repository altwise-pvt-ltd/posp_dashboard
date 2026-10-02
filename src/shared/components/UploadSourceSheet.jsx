import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Camera, FolderOpen, Loader2, SwitchCamera, X } from "lucide-react";

const OPTION =
  "flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition-all duration-150 hover:border-orange-200 hover:bg-orange-50/40 active:scale-[0.99]";

/**
 * Live camera inside the sheet. Starts on the back camera, since this is
 * pointed at documents, and restarts the stream whenever `facing` flips.
 */
function CameraView({ onCapture, onBack }) {
  const videoRef = useRef(null);
  const [facing, setFacing] = useState("environment");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let stream = null;
    const video = videoRef.current;

    const request = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
      : Promise.reject(new Error("Camera not available"));

    request
      .then((granted) => {
        // The sheet closed or the camera was switched while the prompt was up.
        if (cancelled) {
          granted.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = granted;
        if (video) video.srcObject = granted;
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't access the camera. Check permissions, or choose a file instead.");
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
    };
  }, [facing]);

  const switchCamera = () => {
    setReady(false);
    setError(null);
    setFacing((current) => (current === "environment" ? "user" : "environment"));
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    // Full frame at the stream's own resolution, drawn unmirrored.
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex aspect-3/4 max-h-[60vh] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setReady(true)}
          className={`h-full w-full object-contain ${facing === "user" ? "-scale-x-100" : ""}`}
        />

        {error ? (
          <p className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-[0.75rem] font-medium text-white" role="alert">
            <AlertCircle size={20} className="text-red-400" />
            {error}
          </p>
        ) : !ready ? (
          <Loader2 size={24} className="absolute animate-spin text-white/70" />
        ) : null}
      </div>

      <div className="flex items-center justify-between px-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>

        <button
          type="button"
          onClick={capture}
          disabled={!ready || !!error}
          aria-label="Take photo"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg ring-4 ring-orange-500/20 transition-transform active:scale-95 disabled:opacity-40"
        >
          <Camera size={24} strokeWidth={2.25} />
        </button>

        <button
          type="button"
          onClick={switchCamera}
          aria-label="Switch camera"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 active:scale-95"
        >
          <SwitchCamera size={18} />
        </button>
      </div>
    </div>
  );
}

function SheetPanel({ title, onCapture, onPickFiles, onClose }) {
  const [mode, setMode] = useState("choose"); // "choose" | "camera"

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end bg-slate-900/60"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="w-full rounded-t-2xl bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="truncate text-sm font-bold text-slate-800">
            {mode === "camera" ? "Take a photo" : title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X size={15} />
          </button>
        </div>

        {mode === "camera" ? (
          <CameraView onCapture={onCapture} onBack={() => setMode("choose")} />
        ) : (
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => setMode("camera")} className={OPTION}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <Camera size={19} />
              </span>
              <span>
                <span className="block text-[0.8125rem] font-semibold text-slate-800">Capture</span>
                <span className="block text-[0.6875rem] text-slate-500">Take a photo with your camera</span>
              </span>
            </button>

            <button type="button" onClick={onPickFiles} className={OPTION}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-400/10 text-slate-500">
                <FolderOpen size={19} />
              </span>
              <span>
                <span className="block text-[0.8125rem] font-semibold text-slate-800">Files</span>
                <span className="block text-[0.6875rem] text-slate-500">Choose from your phone's storage</span>
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * Bottom sheet that asks where an upload should come from: the live camera
 * (with a front/back switch) or the device's files.
 *
 * `onCapture(file)` receives the photo taken; `onPickFiles()` is expected to
 * open the caller's own file input. The panel only mounts while open, so the
 * camera is released and the sheet returns to the chooser on every close.
 */
export default function UploadSourceSheet({ open, title = "Add a photo", onCapture, onPickFiles, onClose }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <SheetPanel title={title} onCapture={onCapture} onPickFiles={onPickFiles} onClose={onClose} />
      )}
    </AnimatePresence>,
    document.body
  );
}
