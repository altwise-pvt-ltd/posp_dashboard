import { useEffect, useState } from "react";
import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Highlight from "./ui/Highlight";

/* Partner logos — every partner-*.png in the landing assets folder, ordered by
   filename. Dropping a new file in adds it to the comb.
   The logos are decorative (alt=""): the heading already says what they are,
   and the filenames aren't dependable brand names. Swap in an explicit
   name map here if these ever need to be announced individually. */
const partnerModules = import.meta.glob("/src/assets/landing/partner-*.png", {
  eager: true,
  import: "default",
});

const PARTNERS = Object.entries(partnerModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => ({ path, src }));

/* A pointy-top hexagon: flat vertical edges down the sides, points top and
   bottom. Those flat sides are what let neighbours in a row sit flush, and the
   points are what the next row nests into. */
const HEX =
  "[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]";

/* A pointy-top hex is taller than it is wide by 2/√3, i.e. width ÷ height =
   0.866 — that's the `aspect-[0.866]` on the cell below (it has to be a literal
   there for Tailwind to see the class). Rows then sit 75% of a hex height
   apart, so consecutive rows overlap by 0.25 × height = 0.2887 × width. */
const ROW_OVERLAP = 0.2887;

/* How many hexes per row. This is the one thing Tailwind can't express: the
   rows are real DOM nodes, so the count has to be decided in JS before render.
   Widest match wins; anything narrower falls through to BASE_COLUMNS. */
const COLUMN_QUERIES = [
  ["(min-width: 1024px)", 8],
  ["(min-width: 640px)", 6],
];
const BASE_COLUMNS = 4;

function resolveColumns() {
  if (typeof window === "undefined") return BASE_COLUMNS;
  const match = COLUMN_QUERIES.find(
    ([query]) => window.matchMedia(query).matches,
  );
  return match ? match[1] : BASE_COLUMNS;
}

function useHoneycombColumns() {
  const [columns, setColumns] = useState(resolveColumns);

  useEffect(() => {
    const lists = COLUMN_QUERIES.map(([query]) => window.matchMedia(query));
    const update = () => setColumns(resolveColumns());
    lists.forEach((list) => list.addEventListener("change", update));
    return () =>
      lists.forEach((list) => list.removeEventListener("change", update));
  }, []);

  return columns;
}

function chunk(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size)
    rows.push(items.slice(i, i + size));
  return rows;
}

export default function PartnersSection() {
  const columns = useHoneycombColumns();

  if (PARTNERS.length === 0) return null;

  const rows = chunk(PARTNERS, columns);

  /* Every measurement is a percentage of the container width, so the comb
     scales with the viewport on its own.
     A row spans `columns` hexes, and alternate rows slide ±¼ hex, so the comb's
     widest point is columns + 0.5 hexes — that's the divisor that makes the
     block finish flush with the container instead of overflowing it. */
  const hexWidth = 100 / (columns + 0.5);
  const combStyle = {
    "--hex-w": `${hexWidth}%`,
    /* Pull each row up into the notches of the one above it. */
    "--hex-overlap": `${-hexWidth * ROW_OVERLAP}%`,
    /* Half a hex of offset, split ±¼ so the block stays optically centred. */
    "--hex-shift": `${hexWidth / 4}%`,
    "--hex-shift-back": `${-hexWidth / 4}%`,
  };

  return (
    <Section>
      <SectionHeading center className="mb-10">
        Our Top Insurance <Highlight>Partners</Highlight>
      </SectionHeading>

      <div style={combStyle}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`flex justify-center ${
              rowIndex === 0 ? "" : "mt-[var(--hex-overlap)]"
            } ${
              rowIndex % 2 === 0
                ? "translate-x-[var(--hex-shift-back)]"
                : "translate-x-[var(--hex-shift)]"
            }`}
          >
            {row.map((partner) => (
              /* Three boxes, one job each: the cell owns the size and the
                 hairline gap, the ring is the hex border, the face is the hex
                 fill. The border has to be a second clipped layer showing
                 through — a real CSS border would be clipped away with the
                 corners it's drawn on. */
              <div
                key={partner.path}
                className="w-[var(--hex-w)] shrink-0 p-[3px] aspect-[0.866]"
              >
                <div
                  className={`h-full w-full bg-orange-300 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] p-px ${HEX}`}
                >
                  <div
                    className={`flex h-full w-full items-center justify-center bg-white transition-colors hover:bg-orange-50 ${HEX}`}
                  >
                    <img
                      src={partner.src}
                      alt=""
                      loading="lazy"
                      /* The hex is only full width across its middle band, so
                         the logo has to stay inside that inscribed rectangle. */
                      className="max-h-[45%] max-w-[80%] object-contain"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Section>
  );
}
