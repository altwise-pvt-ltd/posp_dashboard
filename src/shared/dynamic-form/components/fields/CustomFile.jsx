import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Plus, UploadCloud, X } from 'lucide-react';
import { useMatchMedia, MOBILE_QUERY } from '@/shared/hooks/useMatchMedia';
import DocumentViewer from '@/shared/components/DocumentViewer';

const nameOf = (entry) => (typeof entry === 'string' ? entry : (entry?.name ?? ''));

const sizeOf = (entry) => {
  if (!(entry instanceof File)) return null;
  return entry.size >= 1024 * 1024
    ? `${(entry.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(entry.size / 1024))} KB`;
};

const isImageFile = (entry) => entry instanceof File && entry.type.startsWith('image/');

/** One object URL per picked File, revoked when the selection changes. */
function useFileUrls(files) {
  const urls = useMemo(
    () => files.map((entry) => (entry instanceof File ? URL.createObjectURL(entry) : null)),
    [files]
  );

  useEffect(
    () => () => urls.forEach((url) => url && URL.revokeObjectURL(url)),
    [urls]
  );

  return urls;
}

/** A picked file as a square: the whole image, or a file icon for anything else. */
function FileSquare({ entry, url, invalid, disabled, onView, onRemove }) {
  const name = nameOf(entry);
  const size = sizeOf(entry);

  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-white ${
        invalid ? 'border-red-400' : 'border-emerald-500'
      }`}
    >
      <button
        type="button"
        onClick={onView}
        disabled={!url}
        aria-label={`View ${name}`}
        className="flex h-full w-full items-center justify-center p-1.5 pb-9 disabled:cursor-default"
      >
        {isImageFile(entry) && url ? (
          <img src={url} alt={name} className="h-full w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-slate-400">
            <FileText size={28} />
            <span className="text-[0.625rem] font-semibold uppercase">
              {name.split('.').pop() || 'File'}
            </span>
          </span>
        )}
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-white/95 px-2 py-1.5">
        <span className="block truncate text-[0.6875rem] font-semibold text-slate-700">{name}</span>
        {size && <span className="block text-[0.625rem] text-slate-400">{size}</span>}
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${name}`}
        className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/**
 * `accept` narrows the picker to what the document allows and `maxCount` decides
 * whether the answer is one file or a list of them. Neither is enforced here:
 * a browser treats `accept` as a filter rather than a rule, and the picker will
 * hand back as many files as it likes. The validator has the last word on both,
 * so the message a user gets says what is wrong instead of the selection
 * silently coming up short.
 */
function CustomFile({ field, value, error, disabled, onChange, onBlur }) {
  const { code, label, required, helperText, accept, maxCount = 1 } = field;
  const multiple = maxCount > 1;

  const inputRef = useRef(null);
  const isMobile = useMatchMedia(MOBILE_QUERY);
  const [dragging, setDragging] = useState(false);
  const [viewing, setViewing] = useState(null); // index of the file open in the viewer

  const describedBy = error ? `${code}-error` : undefined;

  const files = useMemo(
    () => (Array.isArray(value) ? value.filter(Boolean) : value ? [value] : []),
    [value]
  );
  const urls = useFileUrls(files);
  const canAdd = !disabled && (multiple ? files.length < maxCount : files.length === 0);

  // Clearing the input is what lets the same file be picked again after a
  // removal -- without it the picker fires no change event for an unchanged
  // selection, and the file cannot be put back.
  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const addFiles = (picked) => {
    if (picked.length === 0) return;
    onChange?.(multiple ? [...files, ...picked] : picked[0]);
    onBlur?.();
  };

  const handlePick = (event) => {
    addFiles(Array.from(event.target.files ?? []));
    resetInput();
  };

  const removeAt = (position) => {
    resetInput();
    setViewing(null);
    onChange?.(multiple ? files.filter((_, index) => index !== position) : null);
  };

  const border = error
    ? 'border-red-400 bg-red-50/30'
    : dragging
      ? 'border-orange-500 bg-orange-500/5'
      : 'border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/40';

  const viewed = viewing == null ? null : files[viewing];

  return (
    <div className="flex w-full max-w-64 flex-col gap-1.5">
      {/* Two-line slot so squares in the same row line up when a label wraps. */}
      <span
        id={`${code}-label`}
        title={label}
        className="line-clamp-2 min-h-[2.6em] text-[0.8125rem] leading-[1.3] font-semibold text-slate-700"
      >
        {label}
        {required && <span className="ml-0.5 text-orange-500">*</span>}
      </span>

      <input
        id={code}
        name={code}
        type="file"
        ref={inputRef}
        accept={accept || undefined}
        multiple={multiple}
        disabled={disabled}
        aria-labelledby={`${code}-label`}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={handlePick}
        className="hidden"
      />

      <div className={multiple && files.length > 0 ? 'grid grid-cols-2 gap-2' : ''}>
        {files.map((entry, position) => (
          <FileSquare
            key={`${nameOf(entry)}-${position}`}
            entry={entry}
            url={urls[position]}
            invalid={!!error}
            disabled={disabled}
            onView={() => setViewing(position)}
            onRemove={() => removeAt(position)}
          />
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(Array.from(event.dataTransfer.files ?? []));
            }}
            aria-labelledby={`${code}-label`}
            aria-describedby={describedBy}
            className={`flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-2 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/20 ${border}`}
          >
            {files.length > 0 ? (
              <>
                <Plus size={20} className="text-orange-500" />
                <span className="text-[0.6875rem] font-semibold text-orange-600">Add another</span>
              </>
            ) : (
              <>
                <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <UploadCloud size={20} />
                </span>
                <span className="text-[0.75rem] font-semibold text-slate-600">
                  {dragging ? 'Drop it here' : isMobile ? 'Tap to upload' : 'Click or drop'}
                </span>
                {helperText && (
                  <span className="text-[0.625rem] leading-snug text-slate-400">{helperText}</span>
                )}
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p id={`${code}-error`} role="alert" className="text-[0.6875rem] font-medium text-red-500">
          {error}
        </p>
      )}

      <DocumentViewer
        url={viewed ? urls[viewing] : null}
        type={viewed?.type}
        title={viewed ? nameOf(viewed) : label}
        onClose={() => setViewing(null)}
      />
    </div>
  );
}

export default CustomFile;
