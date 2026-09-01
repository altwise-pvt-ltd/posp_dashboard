function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full py-1.75 px-3.5 sm:py-2.25 rounded-xl bg-linear-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 active:scale-[0.98] shadow-md hover:shadow-orange-500/25 text-white text-[0.8125rem] sm:text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-orange-500/30 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
