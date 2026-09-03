import { ChevronDown } from 'lucide-react';

const CONTROL =
  'w-full appearance-none rounded-xl border bg-slate-50 px-3 py-2 pr-10 text-[0.8125rem] text-slate-900 transition-all duration-200 hover:bg-slate-100/50 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:px-3.5 sm:py-2.5 sm:pr-10 sm:text-sm';

function CustomSelect({ field, value, error, disabled, onChange, onBlur }) {
  const { code, label, required, placeholder, helperText, options = [] } = field;
  const describedBy = error ? `${code}-error` : helperText ? `${code}-help` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={code} className="block text-[0.8125rem] font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-orange-500">*</span>}
      </label>

      <div className="relative">
        <select
          id={code}
          name={code}
          value={value ?? ''}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={() => onBlur?.()}
          className={`${CONTROL} ${
            error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200'
          }`}
        >
          <option value="">{placeholder || 'Select'}</option>
          {options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.text}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          strokeWidth={2.5}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

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

export default CustomSelect;
