import { ArrowRight, ArrowRightCircle } from "lucide-react";
import IconCircle from "./IconCircle";

/* Three arrangements of the same card chrome:
   divided — a wide icon panel separated from the copy by a vertical rule
   inline  — a compact row that ends in a forward arrow
   square  — a tile: icon and arrow share the top edge, copy sits on the bottom

   Below `lg` the inline card folds into a tile — icon over title over arrow —
   and drops the description: five full-width rows each carrying two lines of
   copy turns the section into a wall of text you scroll past. Without the
   description the cards are narrow enough to sit two or three to a row, and
   the title gets the width back as extra lines. The row layout and the
   description both return at `lg`, where the section splits and the cards get
   a column of their own. */
const VARIANTS = {
  divided: {
    root: "rounded-none border-b-0 bg-transparent shadow-none flex-col items-center text-center gap-1.5 p-2 md:rounded-xl md:border-b-4 md:border-brand md:bg-linear-to-br md:from-white md:to-orange-50/50 md:shadow-md md:flex-col md:items-start md:text-left md:gap-3.5 md:p-4 lg:flex-row lg:items-stretch lg:overflow-hidden lg:gap-0 lg:p-0",
    icon: "flex items-center lg:px-4 lg:py-5",
    /* `contents` dissolves the footer wrapper, so the copy sits directly in the
       card's flex row the way it did before there was one. */
    footer: "contents",
    body: "pt-0 lg:border-l lg:border-gray-200 lg:px-4 lg:py-5",
    title: "font-medium text-xs md:text-sm lg:text-base",
    desc: "hidden text-xs md:block",
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
    title: "font-medium text-sm leading-snug lg:text-base lg:leading-normal",
    desc: "hidden text-sm lg:block",
    arrow: "size-5 shrink-0 text-brand lg:size-5.5",
    circle: "md",
    circleShape: "squircle-lg",
  },
  /* No forced aspect ratio: grid items stretch to their row on their own, so
     the tallest card in a row sets the height and the rest follow. Locking an
     aspect instead sized every card off its *width*, which on a two-column
     grid left a band of empty card between the icon and the copy.
     The arrow moves up beside the icon rather than trailing the description:
     on the top edge it lands at the same height on every card, where hanging
     off the last line of a one- or two-line description it did not. */
  /* Every box measure here is the previous one at 80%: padding 5→4, gap 4→3,
     floor 40→32, both plates 9→7 and 4.5→3.5, and the `sm` icon plate in place
     of `md`. The type steps down one rung rather than a literal 80% — 20% off
     `text-xs` lands at 9.6px, below what a description should be set at — so
     the title carries the hierarchy on weight and colour where the two meet at
     `text-xs` on mobile. Tokens throughout, not px: the landing page's mobile
     scale rescales the theme variables these resolve to, and a literal would
     sit outside it. */
  square: {
    root: "group cursor-pointer rounded-2xl border card-warm flex-col gap-3 p-4 min-h-32",
    icon: "flex w-full items-center justify-between",
    footer: "mt-auto flex w-full flex-col",
    body: "min-w-0",
    title: "font-semibold text-xs md:text-sm leading-snug group-hover:text-brand",
    desc: "block text-xs",
    /* A filled disc rather than lucide's hairline ArrowRightCircle: it echoes
       the icon plate across the card and gives hover somewhere to land. */
    arrowWrap:
      "grid size-7 shrink-0 place-items-center rounded-full bg-brand/10 text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white",
    arrow: "size-3.5 transition-transform duration-200 group-hover:translate-x-0.5",
    circle: "sm",
    circleShape: "squircle-md",
    arrowInHeader: true,
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

  /* A variant with no `arrow` class opts out of the arrow entirely. Where one
     is wanted, `arrowWrap` chooses the treatment: wrapped in a plate, or the
     bare self-drawn circle icon. */
  const arrow = v.arrow ? (
    v.arrowWrap ? (
      <span className={v.arrowWrap}>
        <ArrowRight className={v.arrow} />
      </span>
    ) : (
      <ArrowRightCircle className={v.arrow} />
    )
  ) : null;

  return (
    <div
      className={`flex ${v.root} ${className}`}
    >
      {/* Layout only — IconCircle owns the plate. A wrapper that paints a
          surface of its own puts a second plate behind the first. */}
      <div className={v.icon}>
        <IconCircle src={icon} size={v.circle} shape={v.circleShape} />
        {v.arrowInHeader && arrow}
      </div>

      <div className={v.footer}>
        <div className={`flex flex-col justify-center ${v.body}`}>
          <h3 className={`text-gray-900 transition-colors duration-200 ${v.title}`}>{title}</h3>
          <p className={`mt-1.5 leading-relaxed text-gray-500 ${v.desc}`}>
            {desc}
          </p>
        </div>

        {!v.arrowInHeader && arrow}
      </div>
    </div>
  );
}
