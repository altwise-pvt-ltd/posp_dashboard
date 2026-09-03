const OPTION =
  'flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[0.8125rem] text-slate-700 transition-all duration-200 hover:bg-slate-100/60 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500/5 has-[:checked]:font-semibold has-[:checked]:text-slate-900 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60';

function CustomRadio({ field, value, error, disabled, onChange, onBlur }) {
  const { code, label, required, helperText, options = [] } = field;
  const describedBy = error ? `${code}-error` : helperText ? `${code}-help` : undefined;

  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={describedBy}>
      <legend className="mb-1.5 text-[0.8125rem] font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-orange-500">*</span>}
      </legend>

      {options.length === 0 ? (
        <p className="text-[0.6875rem] text-slate-400">No options available</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const optionId = `${code}-${String(opt.value).replace(/\W+/g, '_')}`;
            return (
              <label key={String(opt.value)} htmlFor={optionId} className={OPTION}>
                <input
                  id={optionId}
                  name={code}
                  type="radio"
                  value={String(opt.value)}
                  checked={value === opt.value}
                  disabled={disabled}
                  onChange={() => onChange?.(opt.value)}
                  onBlur={() => onBlur?.()}
                  className="size-4 shrink-0 accent-orange-500"
                />
                {opt.text}
              </label>
            );
          })}
        </div>
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
    </fieldset>
  );
}

export default CustomRadio;
