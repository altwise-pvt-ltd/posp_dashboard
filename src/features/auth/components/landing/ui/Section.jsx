/* The centred content column every landing band shares. Exported so the header
   — which is sticky and can't use <Section> — stays the same width. */
export const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-8";

/* Background treatments used across the landing page. */
const TONES = {
  white: "bg-white",
  tint: "bg-brand-tint",
  muted: "bg-gray-50",
  glow: "bg-linear-to-br from-white via-orange-50/40 to-orange-100/30",
};

/* Vertical rhythm. `tight` is the hero, which sits under the header and needs
   less breathing room above it — its top is trimmed ~40% against its own bottom
   so the headline starts closer to the header without cramping the next band. */
const PADDING = {
  default: "py-16 lg:py-20",
  tight: "pt-7 pb-12 lg:pt-10 lg:pb-16",
};

/**
 * Section — the outer shell every landing section shares: a full-bleed tinted
 * band wrapping a centred 1280px content column with responsive gutters.
 */
export default function Section({
  tone = "white",
  padding = "default",
  className = "",
  children,
  ...props
}) {
  return (
    <section className={`${TONES[tone]} ${PADDING[padding]} ${className}`} {...props}>
      <div className={CONTAINER}>{children}</div>
    </section>
  );
}
