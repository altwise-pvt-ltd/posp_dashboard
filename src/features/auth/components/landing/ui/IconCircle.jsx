/* `md` shrinks below `lg`, where the persona cards fold from full-width rows
   into tiles squeezed two or three to a row. */
const SIZES = {
  md: { box: "h-14 w-14 lg:h-18 lg:w-18", image: "h-11 w-11 lg:h-14 lg:w-14" },
  lg: { box: "h-12 w-12 md:h-21 md:w-21", image: "h-6 w-6 md:h-10 md:w-10" },
};

/* A disc everywhere except while a card is folded into a tile, where it reads
   as an app grid — and app grids use squircles, not discs. The two squircles
   differ only in when they open back out: each variant folds at its own
   breakpoint, so the shape has to revert at that same one. */
const SHAPES = {
  circle: "rounded-full",
  "squircle-md": "rounded-2xl md:rounded-full",
  "squircle-lg": "rounded-2xl lg:rounded-full",
};

/**
 * IconCircle — the soft orange gradient plate that sits behind the illustrated
 * icons on the benefit and persona cards. This is the card's only plate: the
 * icon wrappers are layout, so a second surface behind this one reads as a box
 * inside a box.
 */
export default function IconCircle({ src, size = "md", shape = "circle" }) {
  const { box, image } = SIZES[size];

  return (
    /* The hairline is what gives the plate an edge. Its gradient starts white
       and so does the card's, so where the two whites meet — the top of the
       plate — the shape would otherwise dissolve into the card behind it. */
    <div
      className={`flex shrink-0 items-center justify-center bg-linear-to-br from-white to-orange-200/60 ring-1 ring-brand/10 ${SHAPES[shape]} ${box}`}
    >
      <img src={src} alt="" loading="lazy" className={`object-contain ${image}`} />
    </div>
  );
}
