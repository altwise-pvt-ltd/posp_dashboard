/**
 * SectionHeading — the shared <h2> scale for landing sections. Left-aligned by
 * default; `center` is used by the sections whose content is a full-width grid.
 * Spacing stays with the caller since it depends on what follows the heading.
 */
export default function SectionHeading({ center = false, className = "", children }) {
  return (
    <h2
      className={`text-3xl font-bold text-gray-900 lg:text-[40px] lg:leading-[48px] ${
        center ? "text-center" : ""
      } ${className}`}
    >
      {children}
    </h2>
  );
}
