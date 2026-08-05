const SIZES = {
  md: { ring: "h-18 w-18", image: "h-14 w-14" },
  lg: { ring: "h-21 w-21", image: "h-10 w-10" },
};

/**
 * IconCircle — the soft orange gradient disc that sits behind the illustrated
 * icons on the benefit and persona cards.
 */
export default function IconCircle({ src, size = "md" }) {
  const { ring, image } = SIZES[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-white to-orange-200/60 ${ring}`}
    >
      <img src={src} alt="" loading="lazy" className={`object-contain ${image}`} />
    </div>
  );
}
