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
    /* The faint grey band is what makes the comb read as minimal: the hex faces
       stay pure white, so the cells look like cards resting on the page rather
       than outlines drawn onto it. */
    <Section tone="muted">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          Our Network
        </p>

        <SectionHeading center className="mb-4">
          Backed by India's leading <Highlight>insurers</Highlight>
        </SectionHeading>

        {/* Counted from the asset folder, so the claim can't drift out of date
            as logos are added. */}
        <p className="text-sm leading-relaxed text-gray-500">
          {PARTNERS.length} insurance companies on a single platform — quote,
          compare and issue across every major line of business without ever
          leaving the app.
        </p>
      </div>

      <div style={combStyle}>
        {rows.map((row, rowIndex) => (
          /* Rows are transformed, so each one is its own stacking context and a
             hovered hex can't lift over the row below on its own. Raising the
             whole row on hover is what lets the lift read cleanly. */
          <div
            key={rowIndex}
            className={`relative flex justify-center hover:z-10 ${
              rowIndex === 0 ? "" : "mt-[var(--hex-overlap)]"
            } ${
              rowIndex % 2 === 0
                ? "translate-x-[var(--hex-shift-back)]"
                : "translate-x-[var(--hex-shift)]"
            }`}
          >
            {row.map((partner) => (
              /* Three boxes, one job each: the cell owns the size, the hairline
                 gap and the hover lift, the ring is the hex border, the face is
                 the hex fill. The border has to be a second clipped layer
                 showing through — a real CSS border would be clipped away with
                 the corners it's drawn on. drop-shadow (not box-shadow) is what
                 follows the hex silhouette instead of its bounding box. */
              <div
                key={partner.path}
                className="group w-[var(--hex-w)] shrink-0 p-[3px] aspect-[0.866] transition duration-300 ease-out hover:-translate-y-1 hover:drop-shadow-lg"
              >
                <div
                  className={`h-full w-full bg-gray-200 p-px transition-colors duration-300 group-hover:bg-brand/50 ${HEX}`}
                >
                  <div
                    className={`flex h-full w-full items-center justify-center bg-white transition-colors duration-300 group-hover:bg-brand-tint ${HEX}`}
                  >
                    <img
                      src={partner.src}
                      alt=""
                      loading="lazy"
                      /* Held back at rest so the wall reads as one calm block
                         and no single brand shouts; full colour on hover.
                         Add `grayscale group-hover:grayscale-0` here for the
                         fully desaturated treatment. */
                      className="max-h-[45%] max-w-[80%] object-contain  transition-opacity duration-300 group-hover:opacity-100"
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
