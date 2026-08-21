import { useRef, useState, useCallback, useEffect } from "react";
import { UploadCloud, X, CheckCircle2, FileImage, AlertCircle, Loader2 } from "lucide-react";
import { DOCUMENT, acceptAttribute, policyCaption } from "@/shared/upload/policy";
import { prepareFile } from "@/shared/upload/validate";

export default function FileUpload({
  id,
  label,
  required = false,
  profile = DOCUMENT,
  onChange,
  onError,
  error,
  hint,
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejection, setRejection] = useState(null);


  const selectionRef = useRef(0);
  const mountedRef = useRef(true);


  const previewRef = useRef(null);
  const showPreview = useCallback((url) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  }, []);

  useEffect(() => {

    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const processFile = useCallback(
    async (candidate) => {
      if (!candidate) return;

      const selection = selectionRef.current + 1;
      selectionRef.current = selection;

      const isCurrent = () => mountedRef.current && selectionRef.current === selection;

      setRejection(null);
      setBusy(true);

      const result = await prepareFile(candidate, profile);

      if (!isCurrent()) return;
      setBusy(false);

      if (!result.ok) {
        setRejection(result.message);
        // Report outward so the caller can also surface a toast if it wants —
        // the component itself stays decoupled from the alert system.
        onError?.(result.message);
        return;
      }

      // `result.file` rather than the original matters for a HEIC, which
      // arrives here as the JPEG it was transcoded into, and for an oversized
      // photo, which arrives compressed. Everything else is the same File the
      // user picked.
      setFile(result.file);
      onChange?.(result.file);
      showPreview(URL.createObjectURL(result.file));
    },
    [profile, onChange, onError, showPreview]
  );

  const hasFile = !!file;
  const interactive = !hasFile && !busy;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    // Same guard the click path uses. A filled zone shows no browse affordance,
    // so accepting a drop onto it would silently replace a file the user can't
    // see themselves replacing.
    if (!interactive) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) processFile(dropped);
  };

  const handleInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const clear = (e) => {
    e.stopPropagation();
    // Bump the counter so in-flight work can't repopulate the field after the
    // user has cleared it.
    selectionRef.current += 1;
    setFile(null);
    showPreview(null);
    setRejection(null);
    setBusy(false);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayError = error || rejection;

  // Discrete-state styling → fixed class sets picked per state.
  const zoneBorder = displayError
    ? "border-red-400"
    : dragging
    ? "border-orange-500"
    : hasFile
    ? "border-emerald-500"
    : "border-slate-200";

  const zoneBg = dragging
    ? "bg-orange-500/5"
    : hasFile
    ? "bg-emerald-500/5"
    : "bg-slate-50";

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-orange-500">*</span>}
      </label>

      <div
        onClick={() => interactive && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (interactive) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-27.5 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${zoneBorder} ${zoneBg} ${
          interactive ? "cursor-pointer" : "cursor-default"
        }`}
      >
        {/* Hidden input */}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={acceptAttribute(profile)}
          {...(profile.capture ? { capture: profile.capture } : {})}
          className="hidden"
          onChange={handleInputChange}
        />

        {busy ? (
          /* ── Working state — checking the file, transcoding a HEIC,
                compressing an oversized photo ── */
          <div className="flex w-full flex-col items-center gap-2 px-4 py-4 sm:py-5 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10">
              <Loader2 size={22} className="animate-spin text-orange-500" />
            </div>
            <span className="text-[0.8125rem] font-semibold text-slate-600">
              Checking your photo…
            </span>
            <span className="text-[0.6875rem] text-slate-400">
              Large or iPhone photos take a moment.
            </span>
          </div>
        ) : hasFile ? (
          /* ── File preview state ── */
          <div className="flex w-full items-center gap-3.5 px-4 py-3.5">
            {/* Thumbnail — always renders now that everything is JPG or PNG */}
            <div className="flex h-17 w-17 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-slate-200 bg-slate-100">
              {preview ? (
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <FileImage size={28} className="text-slate-400" />
              )}
            </div>

            {/* File info */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.8125rem] font-semibold text-slate-800">
                {file.name}
              </div>
              <div className="mt-0.75 text-[0.75rem] text-slate-500">
                {(file.size / 1024).toFixed(0)} KB · {file.type || "file"}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.75 text-[0.6875rem] font-semibold text-emerald-600">
                <CheckCircle2 size={11} />
                Uploaded
              </div>
            </div>

            {/* Clear button */}
            <button
              type="button"
              onClick={clear}
              className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-150 hover:border-red-300 hover:bg-red-100 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          /* ── Empty / drag state ── */
          <div className="flex flex-col items-center gap-1.5 px-4 py-4 sm:py-5 text-center">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
                dragging ? "bg-orange-500/10" : "bg-slate-400/10"
              }`}
            >
              <UploadCloud
                size={22}
                className={`transition-colors duration-200 ${dragging ? "text-orange-500" : "text-slate-400"}`}
              />
            </div>
            <div>
              <span className={`text-[0.8125rem] font-semibold ${dragging ? "text-orange-500" : "text-slate-600"}`}>
                {dragging ? "Drop it here" : "Click to browse"}
              </span>
              <span className="text-[0.8125rem] text-slate-400"> or drag & drop</span>
            </div>
            {/* Derived from the profile, so it can never advertise a format the
                validator rejects. */}
            <div className="text-[0.6875rem] text-slate-300">
              {policyCaption(profile)}
            </div>
          </div>
        )}
      </div>

      {/* Hint or error */}
      {displayError ? (
        <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] font-medium text-red-500" role="alert">
          <AlertCircle size={12} className="shrink-0" />
          {displayError}
        </p>
      ) : hint ? (
        <p className="mt-0.5 text-[0.75rem] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
