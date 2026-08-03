/* Partner logos — dynamically imported via Vite's import.meta.glob */
const partnerModules = import.meta.glob("/src/assets/landing/partner-*.png", {
  eager: true,
  import: "default",
});

const PARTNERS = Object.entries(partnerModules).map(([path, src]) => {
  const num = path.match(/partner-(\d+)/)?.[1] ?? "0";
  return { id: Number(num), src, alt: `Insurance Partner ${num}` };
}).sort((a, b) => a.id - b.id);

export default function PartnersSection() {
  if (PARTNERS.length === 0) return null;

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        {/* Heading */}
        <h2 className="text-center text-3xl lg:text-[40px] lg:leading-[48px] font-bold text-gray-900 mb-12">
          Our Top Insurance{" "}
          <span className="text-[#f47c3c]">Partners</span>
        </h2>

        {/* Logo grid — 3 cols mobile, 4 cols sm, 6 cols lg */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {PARTNERS.map((partner) => (
            <div
              key={partner.id}
              className="flex items-center justify-center rounded-2xl border border-stone-200 bg-white p-4 h-20"
            >
              <img
                src={partner.src}
                alt={partner.alt}
                className="max-h-10 max-w-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
