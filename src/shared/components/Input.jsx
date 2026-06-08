function Input({ id, label, error, ref, className = '', labelClassName = '', ...props }) {
  return (
    <div className="mb-3 sm:mb-3.5">
      <label
        htmlFor={id}
        className={`block mb-1 sm:mb-1.5 text-xs sm:text-sm font-semibold text-slate-700 ${
          /* Reserve two lines of label height at sm+ so single-line and
             wrapped labels keep their inputs aligned across grid columns.
             flex + items-end keeps a one-line label sitting at the bottom,
             so it lines up with the first line of a wrapping neighbour. */
          label ? 'sm:flex sm:items-end sm:min-h-[2.5rem]' : ''
        } ${labelClassName}`}
      >
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        className={`w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1 duration-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;