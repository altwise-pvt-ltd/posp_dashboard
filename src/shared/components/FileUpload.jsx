import { useRef, useState, useCallback } from "react";
import { UploadCloud, X, CheckCircle2, FileImage, AlertCircle } from "lucide-react";

/**
 * FileUpload — drag-and-drop + click-to-browse upload zone.
 *
 * Presentational + self-contained: it owns its own file/preview state and
 * reports outward via callbacks. It does NOT talk to the global alert store —
 * a generic input shouldn't depend on app infrastructure. The inline note below
 * the zone is the built-in feedback; wire `onError` to a toast if you want one.
 *
 * Props:
 *   id          string   — unique id for the hidden <input>
 *   label       string   — field label shown above the zone
 *   required    bool     — shows red asterisk
 *   accept      string   — e.g. "image/*" (default)
 *   maxMB       number   — max file size in MB (default 10)
 *   onChange    fn(File|null) — called when the accepted file changes
 *   onError     fn(message)   — called when a file is rejected (e.g. too large)
 *   error       string   — validation error message (from the caller / RHF)
 *   hint        string   — optional caption below the zone
 *
 * Tailwind note: the zone's border/background swap between discrete states
 * (error / dragging / has-file / idle), so each state maps to a fixed set of
 * classes chosen with a ternary — not a runtime-computed style.
 */
export default function FileUpload({
  id,
  label,
  required = false,
  accept = "image/*",
  maxMB = 10,
  onChange,
  onError,
  error,
  hint,
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [sizeError, setSizeError] = useState(null);

  const processFile = useCallback(
    (f) => {
      if (!f) return;
      setSizeError(null);
      if (f.size > maxMB * 1024 * 1024) {
        const msg = `File too large. Max size is ${maxMB} MB.`;
        setSizeError(msg);
        // Report outward so the caller can also surface a toast if it wants —
        // the component itself stays decoupled from the alert system.
        onError?.(`"${f.name}" is too large. Max size is ${maxMB} MB.`);
        return;
      }
      setFile(f);
      onChange?.(f);
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(f);
      } else {
        setPreview(null);
      }
    },
    [maxMB, onChange, onError]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) processFile(dropped);
  };

  const handleInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const clear = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setSizeError(null);
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayError = error || sizeError;
  const hasFile = !!file;

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
        onClick={() => !hasFile && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-27.5 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${zoneBorder} ${zoneBg} ${
          hasFile ? "cursor-default" : "cursor-pointer"
        }`}
      >
        {/* Hidden input */}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
        />

        {hasFile ? (
          /* ── File preview state ── */
          <div className="flex w-full items-center gap-3.5 px-4 py-3.5">
            {/* Thumbnail or file icon */}
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
            <div className="text-[0.6875rem] text-slate-300">
              JPG, PNG, PDF · Max {maxMB} MB
            </div>
          </div>
        )}
      </div>

      {/* Hint or error */}
      {displayError ? (
        <p className="mt-0.5 flex items-center gap-1.5 text-[0.75rem] font-medium text-red-500" role="alert">
          <AlertCircle size={12} />
          {displayError}
        </p>
      ) : hint ? (
        <p className="mt-0.5 text-[0.75rem] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
