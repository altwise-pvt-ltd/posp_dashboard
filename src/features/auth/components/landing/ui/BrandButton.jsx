/* Sizes map to the three places a solid orange CTA appears: compact in the
   header, standard in the hero, and roomier for the section-closing calls to
   action. `field` matches the tighter radius used inside the login card. */
const SIZES = {
  sm: "rounded-xl px-6 py-3 text-sm",
  md: "rounded-xl px-7 py-3.5 text-base",
  lg: "rounded-xl px-7 py-4 text-base",
  field: "rounded-lg py-3 text-[15px]",
};

/**
 * BrandButton — the solid orange call to action. One definition of the brand
 * fill, hover, shadow and focus ring for every CTA on the page.
 */
export default function BrandButton({
  size = "md",
  type = "button",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 bg-brand font-semibold text-white shadow-md transition-colors hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60 ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
