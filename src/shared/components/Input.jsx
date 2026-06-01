function Input({ id, label, error, ref, className = '', ...props }) {
  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="block mb-2 text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        className={`w-full px-4 py-3 rounded-xl border bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1 duration-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
