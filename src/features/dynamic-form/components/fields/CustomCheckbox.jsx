function CustomCheckbox({ field, value, error, disabled, onChange, onBlur }) {
  const { code, label, helperText } = field;
  const describedBy = error ? `${code}-error` : helperText ? `${code}-help` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={code}
        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border bg-slate-50 px-3 py-2.5 text-[0.8125rem] text-slate-700 transition-all duration-200 hover:bg-slate-100/60 has-[:checked]:bg-orange-500/5 has-[:checked]:text-slate-900 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
          error ? 'border-red-400' : 'border-slate-200 has-[:checked]:border-orange-500'
        }`}
      >
        <input
          id={code}
          name={code}
          type="checkbox"
          checked={!!value}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          onChange={(e) => onChange?.(e.target.checked)}
          onBlur={() => onBlur?.()}
          className="mt-0.5 size-4 shrink-0 rounded accent-orange-500"
        />
        <span>{label}</span>
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

export default CustomCheckbox;
