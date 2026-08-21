import { ChevronDown } from 'lucide-react';

/**
 * A dropdown built to sit next to `Input` without anyone noticing the seam.
 *
 * The wrapper, label and error line are deliberately identical to Input's —
 * including the two-line label reserve at `sm:`, which is what keeps a select
 * and a text field aligned when they share a grid row and one label wraps.
 * Diverging here would show up as a half-line offset on exactly the layouts
 * that pair them.
 *
 * A native `<select>` rather than a custom listbox: it opens as the platform
 * picker on mobile, is keyboard- and screen-reader-correct for free, and takes
 * a react-hook-form `register()` spread the same way an input does. The only
 * concession to design is `appearance-none` plus a chevron drawn on top, since
 * the native arrow can't be styled to match the rest of the form.
 *
 * `options` is `[{ value, label }]` — the shape the masters endpoints return,
 * so a fetched list can be passed straight through.
 */
function Select({
  id,
  label,
  error,
  options = [],
  placeholder,
  ref,
  className = '',
  labelClassName = '',
  ...props
}) {
  return (
    <div className="mb-3 sm:mb-3.5">
      <label
        htmlFor={id}
        className={`block mb-1 sm:mb-1.5 text-xs sm:text-sm font-semibold text-slate-700 ${
          label ? 'sm:flex sm:items-end sm:min-h-[2.5rem]' : ''
        } ${labelClassName}`}
      >
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          ref={ref}
          className={`w-full appearance-none px-3 py-2 pr-10 sm:px-3.5 sm:py-2.5 sm:pr-10 rounded-xl border bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm sm:text-base text-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
          } ${className}`}
          {...props}
        >
          {/* Kept selectable rather than disabled: clearing a choice is a
              legitimate thing to want, and the schema is what enforces that a
              value was picked. */}
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(({ value, label: optionLabel }) => (
            <option key={value} value={value}>
              {optionLabel}
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

      {error && (
        <p
          className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1 duration-300"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;
