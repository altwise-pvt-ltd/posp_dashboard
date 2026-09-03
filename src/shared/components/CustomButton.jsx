import { Loader2 } from "lucide-react";
import { mergeClasses } from "../styles/mergeClasses";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100";

const VARIANTS = {
  primary:
    "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/10 hover:from-orange-600 hover:to-rose-600 hover:shadow-orange-500/25 focus-visible:ring-orange-500/40",
  tonal:
    "bg-primary-container text-on-primary shadow-[0_4px_12px_-4px_rgba(255,107,0,0.4)] hover:bg-primary-container/90 focus-visible:ring-primary",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm focus-visible:ring-slate-400",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
  danger:
    "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-red-500/25 focus-visible:ring-red-500/40",
};

const SIZES = {
  sm: "py-1.5 px-3 text-xs [&_svg]:size-3.5",
  md: "py-1.75 sm:py-2.25 px-3.5 text-[0.8125rem] sm:text-sm [&_svg]:size-4",
  lg: "py-2.5 sm:py-3 px-5 text-sm sm:text-base [&_svg]:size-[18px]",
  dash: "py-unit px-gutter text-body-lg [&_svg]:size-5",
};

function CustomButton({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  type = "button",
  disabled,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={mergeClasses(
        BASE,
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        fullWidth && "flex w-full",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" /> : leftIcon}
      {children}
      {loading ? null : rightIcon}
    </button>
  );
}

export default CustomButton;
