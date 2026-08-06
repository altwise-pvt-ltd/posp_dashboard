import { ArrowRightCircle } from "lucide-react";
import IconCircle from "./IconCircle";

/* Two arrangements of the same card chrome:
   divided — a wide icon panel separated from the copy by a vertical rule
   inline  — a compact row that ends in a forward arrow

   Below `lg` the inline card folds into a tile — icon over title over arrow —
   and drops the description: five full-width rows each carrying two lines of
   copy turns the section into a wall of text you scroll past. Without the
   description the cards are narrow enough to sit two or three to a row, and
   the title gets the width back as extra lines. The row layout and the
   description both return at `lg`, where the section splits and the cards get
   a column of their own. */
const VARIANTS = {
  divided: {
    root: "rounded-none border-b-0 bg-transparent shadow-none flex-col items-center text-center gap-1.5 p-2 md:rounded-xl md:border-b-4 md:border-brand md:bg-linear-to-br md:from-white md:to-orange-50/50 md:shadow-md md:flex-col md:items-start md:text-left md:gap-4 md:p-5 lg:flex-row lg:items-stretch lg:overflow-hidden lg:gap-0 lg:p-0",
    icon: "flex items-center lg:px-5 lg:py-6",
    /* `contents` dissolves the footer wrapper, so the copy sits directly in the
       card's flex row the way it did before there was one. */
    footer: "contents",
    body: "pt-0 lg:border-l lg:border-gray-200 lg:px-5 lg:py-6",
    title: "text-xs md:text-base lg:text-lg",
    desc: "hidden md:block",
    arrow: "",
    circle: "lg",
    circleShape: "circle",
  },
  inline: {
    root: "rounded-xl border-b-4 border-brand bg-linear-to-br from-white to-orange-50/50 shadow-md flex-col items-start gap-3 p-4 lg:flex-row lg:items-center lg:gap-4 lg:p-5",
    icon: "flex items-center",
    /* The tile's bottom line: title at the start, arrow at the end, sharing a
       baseline via items-end so a title that wraps grows upward off the arrow
       rather than shunting it around. mt-auto holds the pair on the card's
       bottom edge whatever height the row stretches to, which is what keeps
       titles and arrows level across the row. At `lg` the wrapper flattens back
       into the card's own row and just carries copy → arrow. */
    footer:
      "mt-auto flex w-full items-end gap-2 lg:mt-0 lg:flex-1 lg:items-center lg:gap-4",
    body: "min-w-0 flex-1",
    title: "text-sm leading-snug lg:text-base lg:leading-normal",
    desc: "hidden lg:block",
    arrow: "size-5 shrink-0 text-brand lg:size-5.5",
    circle: "md",
    circleShape: "squircle-lg",
  },
  square: {
    root: "rounded-2xl border card-warm flex-col justify-between p-5 aspect-square sm:aspect-[1.15] cursor-pointer group",
    icon: "flex items-center",
    footer: "flex w-full items-end justify-between gap-3 mt-auto",
    body: "min-w-0 flex-1",
    title: "text-sm md:text-base leading-snug group-hover:text-brand transition-colors duration-200",
    desc: "block text-xs leading-normal text-gray-500 mt-1.5 line-clamp-2 pr-2",
    arrow: "size-5 shrink-0 text-brand group-hover:translate-x-1 transition-all duration-200",
    circle: "md",
    circleShape: "squircle-md",
  },
};

/**
 * FeatureCard — the orange-underlined gradient card shared by the "Why Become"
 * and "Who Can Become" sections.
 */
export default function FeatureCard({
  icon,
  title,
  desc,
  variant = "inline",
  className = "",
}) {
  const v = VARIANTS[variant];

  return (
    <div
      className={`flex ${v.root} ${className}`}
    >
      {/* Layout only — IconCircle owns the plate. A wrapper that paints a
          surface of its own puts a second plate behind the first. */}
      <div className={v.icon}>
        <IconCircle src={icon} size={v.circle} shape={v.circleShape} />
      </div>

      <div className={v.footer}>
        <div className={`flex flex-col justify-center ${v.body}`}>
          <h3 className={`font-medium text-gray-900 transition-colors duration-200 ${v.title}`}>{title}</h3>
          <p className={`mt-1.5 text-sm leading-relaxed text-gray-500 ${v.desc}`}>
            {desc}
          </p>
        </div>

        {(variant === "inline" || variant === "square") && (
          <ArrowRightCircle className={v.arrow} />
        )}
      </div>
    </div>
  );
}
