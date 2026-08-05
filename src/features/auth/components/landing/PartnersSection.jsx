import Section from "./ui/Section";
import SectionHeading from "./ui/SectionHeading";
import Highlight from "./ui/Highlight";

/* Partner logos — every partner-*.png in the landing assets folder, ordered by
   filename. Dropping a new file in adds it to the grid.
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

export default function PartnersSection() {
  if (PARTNERS.length === 0) return null;

  return (
    <Section>
      <SectionHeading center className="mb-12">
        Our Top Insurance <Highlight>Partners</Highlight>
      </SectionHeading>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {PARTNERS.map((partner) => (
          <div
            key={partner.path}
            className="flex h-20 items-center justify-center rounded-2xl border border-stone-200 bg-white p-4"
          >
            <img
              src={partner.src}
              alt=""
              loading="lazy"
              className="max-h-10 max-w-full object-contain"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
