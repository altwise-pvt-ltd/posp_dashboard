import { useRef } from 'react';
import { X } from 'lucide-react';

const CONTROL =
  'w-full cursor-pointer rounded-xl border bg-slate-50 px-3 py-2 text-[0.8125rem] text-slate-500 transition-all duration-200 hover:bg-slate-100/50 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-orange-500/10 file:px-3 file:py-1.5 file:text-[0.75rem] file:font-semibold file:text-orange-600 hover:file:bg-orange-500/20 sm:px-3.5 sm:py-2.5 sm:text-sm';

function CustomFile({ field, value, error, disabled, onChange, onBlur }) {
  const { code, label, required } = field;
  const inputRef = useRef(null);
  const describedBy = error ? `${code}-error` : undefined;

  const selectedName =
    value instanceof File ? value.name : typeof value === 'string' && value ? value : '';

  const clear = () => {
    if (inputRef.current) inputRef.current.value = '';
    onChange?.(null);
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
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={(e) => onChange?.(e.target.files?.[0] ?? null)}
        onBlur={() => onBlur?.()}
        className={`${CONTROL} ${
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200'
        }`}
      />

      {selectedName && (
        <div className="flex items-center gap-2 text-[0.6875rem] text-slate-500">
          <span className="truncate">{selectedName}</span>
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            aria-label={`Remove ${label}`}
            className="flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {error && (
        <p id={`${code}-error`} role="alert" className="text-[0.6875rem] font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export default CustomFile;
