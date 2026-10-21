function CustomToggle({ field, value, error, disabled, onChange, onBlur }) {
  const { code, label, helperText } = field;
  const describedBy = error ? `${code}-error` : helperText ? `${code}-help` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={code}
        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-slate-50 px-3 py-2.5 text-[0.8125rem] font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100/60 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
      >
        <span>{label}</span>

        <input
          id={code}
          name={code}
          type="checkbox"
          role="switch"
          checked={!!value}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => onChange?.(e.target.checked)}
          onBlur={() => onBlur?.()}
          className="peer sr-only"
        />

        <span
          aria-hidden="true"
          className="relative h-5.5 w-9.5 shrink-0 rounded-full bg-slate-300 transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:size-4.5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:bg-orange-500 peer-checked:after:translate-x-4 peer-focus-visible:ring-4 peer-focus-visible:ring-orange-500/20"
        />
      </label>

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

export default CustomToggle;
