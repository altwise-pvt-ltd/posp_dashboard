import { useRef, useState, useCallback, useEffect } from "react";
import { UploadCloud, X, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import { DOCUMENT, acceptAttribute, policyCaption } from "@/shared/upload/policy";
import { prepareFile } from "@/shared/upload/validate";
import { useMatchMedia, MOBILE_QUERY } from "@/shared/hooks/useMatchMedia";
import UploadSourceSheet from "@/shared/components/UploadSourceSheet";

export default function FileUpload({
  id,
  label,
  required = false,
  profile = DOCUMENT,
  initialFile = null,
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

  // Phones get a sheet to choose between the camera and files.
  const isMobile = useMatchMedia(MOBILE_QUERY);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

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

  /**
   * Adopt a document already on file — see `useDocumentFiles`.
   *
   * Guarded on `selectionRef` still being untouched, so this can only ever fill
   * an empty zone. Once the user has picked a file or cleared the field, the
   * counter has moved and the restored copy stays out: re-adopting it would put
   * back a document they had just replaced or deliberately removed.
   *
   * The bytes are not re-run through `prepareFile` — they came from the server,
   * which means they already passed it on the way up.
   */
  useEffect(() => {
    if (!initialFile || selectionRef.current !== 0) return;
    setFile(initialFile);
    showPreview(URL.createObjectURL(initialFile));
  }, [initialFile, showPreview]);

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

  // Counts enter/leave pairs so moving over the zone's own children doesn't end the drag.
  const dragDepthRef = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    if (interactive) setDragging(true);
  };

  const handleDragLeave = () => {
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    // Same guard the click path uses. A filled zone shows no browse affordance,
    // so accepting a drop onto it would silently replace a file the user can't
    // see themselves replacing.
    if (!interactive) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) processFile(dropped);
  };

  // Label and zone share one entry point, so both respect the same guard.
  const openPicker = () => {
    if (!interactive) return;
    if (isMobile) setSheetOpen(true);
    else inputRef.current?.click();
  };

  const handleZoneKeyDown = (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    // Stops Space from scrolling the page.
    e.preventDefault();
    openPicker();
  };

  const handleInputChange = (e) => {
    const selected = e.target.files?.[0];
    // Reset so picking the same file again (e.g. after a rejection) still fires onChange.
    e.target.value = "";
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
    onChange?.(null);
  };

  // Rejection first: a file the validator just refused is newer information than
  // the form-level error still standing from the last submit, and showing the
  // stale "please upload a file" over it made every rejection look like the
  // drop zone had simply ignored the pick.
  const displayError = rejection || error;

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
      <label
        id={`${id}-label`}
        htmlFor={id}
        onClick={(e) => {
          e.preventDefault();
          openPicker();
        }}
        className="block text-[0.8125rem] font-semibold text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-orange-500">*</span>}
      </label>

      {/* Only a button while empty, so the clear button is never nested inside one. */}
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-labelledby={interactive ? `${id}-label` : undefined}
        onClick={openPicker}
        onKeyDown={interactive ? handleZoneKeyDown : undefined}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex min-h-25 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-orange-500/40 ${zoneBorder} ${zoneBg} ${
          interactive ? "cursor-pointer" : "cursor-default"
        }`}
      >
        {/* Hidden input */}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={acceptAttribute(profile)}
          className="hidden"
          // Keeps the programmatic click from bubbling to the zone and reopening the sheet.
          onClick={(e) => e.stopPropagation()}
          onChange={handleInputChange}
        />

        {busy ? (
          /* ── Working state — checking the file, transcoding a HEIC,
                compressing an oversized photo ── */
          <div className="flex w-full flex-col items-center gap-2 px-3.5 py-3.5 sm:py-4.5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <Loader2 size={20} className="animate-spin text-orange-500" />
            </div>
            <span className="text-[0.75rem] font-semibold text-slate-600">
              Checking your file…
            </span>
            <span className="text-[0.625rem] text-slate-400">
              Large or iPhone photos take a moment.
            </span>
          </div>
        ) : hasFile ? (
          /* ── File preview state ── */
          <div className="flex w-full items-center gap-3 px-3.5 py-3">
            {/* Images get a thumbnail; a PDF gets a file icon */}
            <div className="flex h-15 w-15 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-slate-200 bg-slate-100">
              {file.type.startsWith("image/") ? (
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <FileText size={22} className="text-slate-400" />
              )}
            </div>

            {/* File info */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.75rem] font-semibold text-slate-800">
                {file.name}
              </div>
              <div className="mt-0.75 text-[0.6875rem] text-slate-500">
                {(file.size / 1024).toFixed(0)} KB · {file.type || "file"}
              </div>
              <div className="mt-1.75 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.25 py-0.75 text-[0.625rem] font-semibold text-emerald-600">
                <CheckCircle2 size={10} />
                Added
              </div>
            </div>

            {/* Clear button */}
            <button
              type="button"
              onClick={clear}
              className="flex h-6.75 w-6.75 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all duration-150 hover:border-red-300 hover:bg-red-100 hover:text-red-500"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          /* ── Empty / drag state ── */
          <div className="flex flex-col items-center gap-1.5 px-3.5 py-3.5 sm:py-4.5 text-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                dragging ? "bg-orange-500/10" : "bg-slate-400/10"
              }`}
            >
              <UploadCloud
                size={20}
                className={`transition-colors duration-200 ${dragging ? "text-orange-500" : "text-slate-400"}`}
              />
            </div>
            <div>
              <span className={`text-[0.75rem] font-semibold ${dragging ? "text-orange-500" : "text-slate-600"}`}>
                {dragging ? "Drop it here" : isMobile ? "Tap to capture" : "Click to browse"}
              </span>
              <span className="text-[0.75rem] text-slate-400">
                {isMobile ? " or choose a file" : " or drag & drop"}
              </span>
            </div>
            {/* Derived from the profile, so it can never advertise a format the
                validator rejects. */}
            <div className="text-[0.625rem] text-slate-300">
              {policyCaption(profile)}
            </div>
          </div>
        )}
      </div>

      {/* Hint or error */}
      {displayError ? (
        <p className="mt-0.5 flex items-center gap-1.5 text-[0.6875rem] font-medium text-red-500" role="alert">
          <AlertCircle size={11} className="shrink-0" />
          {displayError}
        </p>
      ) : hint ? (
        <p className="mt-0.5 text-[0.6875rem] text-slate-400">{hint}</p>
      ) : null}

      {/* A captured photo goes through the same checks as a picked file. */}
      <UploadSourceSheet
        open={sheetOpen}
        title={label}
        onClose={closeSheet}
        onPickFiles={() => {
          closeSheet();
          inputRef.current?.click();
        }}
        onCapture={(captured) => {
          closeSheet();
          processFile(captured);
        }}
      />
    </div>
  );
}
