import { useRef } from 'react';
import { X } from 'lucide-react';

const CONTROL =
  'w-full cursor-pointer rounded-xl border bg-slate-50 px-3 py-2 text-[0.8125rem] text-slate-500 transition-all duration-200 hover:bg-slate-100/50 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-orange-500/10 file:px-3 file:py-1.5 file:text-[0.75rem] file:font-semibold file:text-orange-600 hover:file:bg-orange-500/20 sm:px-3.5 sm:py-2.5 sm:text-sm';

const nameOf = (entry) => (typeof entry === 'string' ? entry : (entry?.name ?? ''));

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
  const describedBy = error ? `${code}-error` : helperText ? `${code}-help` : undefined;

  const files = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];

  // Clearing the input is what lets the same file be picked again after a
  // removal -- without it the picker fires no change event for an unchanged
  // selection, and the file cannot be put back.
  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const handlePick = (event) => {
    const picked = Array.from(event.target.files ?? []);
    onChange?.(multiple ? picked : (picked[0] ?? null));
  };

  const removeAt = (position) => {
    resetInput();
    if (!multiple) {
      onChange?.(null);
      return;
    }
    onChange?.(files.filter((_, index) => index !== position));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={code} className="block text-[0.8125rem] font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-orange-500">*</span>}
      </label>

      <input
        id={code}
        name={code}
        type="file"
        ref={inputRef}
        accept={accept || undefined}
        multiple={multiple}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={handlePick}
        onBlur={() => onBlur?.()}
        className={`${CONTROL} ${
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200'
        }`}
      />

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((entry, position) => (
            <li
              key={`${nameOf(entry)}-${position}`}
              className="flex items-center gap-2 text-[0.6875rem] text-slate-500"
            >
              <span className="truncate">{nameOf(entry)}</span>
              <button
                type="button"
                onClick={() => removeAt(position)}
                disabled={disabled}
                aria-label={`Remove ${nameOf(entry) || label}`}
                className="flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <p id={`${code}-error`} role="alert" className="text-[0.6875rem] font-medium text-red-500">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${code}-help`} className="text-[0.6875rem] text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export default CustomFile;
