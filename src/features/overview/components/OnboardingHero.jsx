import AppLink from '@/shared/components/AppLink';
import healthImg from '@/assets/products/Health.webp';
import motorImg from '@/assets/products/Motor.webp';
import termLifeImg from '@/assets/products/TermLife.webp';
import businessImg from '@/assets/products/Business.webp';
import commercialImg from '@/assets/products/Commercial.webp';

const PRODUCTS = [
  {
    key: 'health',
    title: 'Health',
    subtitle: '12 plans · individual & family',
    img: healthImg,
    imgSize: [372, 276],
    bg: 'bg-amber-50',
    hoverBorder: 'hover:border-amber-300',
    to: '/onboarding/health',
  },
  {
    key: 'motor',
    title: 'Motor',
    subtitle: '8 plans · car, bike, EV',
    img: motorImg,
    imgSize: [478, 484],
    bg: 'bg-sky-50',
    hoverBorder: 'hover:border-sky-300',
    to: '/onboarding/motor',
  },
  {
    key: 'term-life',
    title: 'Term & Life',
    subtitle: '10 plans · term + life cover',
    img: termLifeImg,
    imgSize: [431, 579],
    bg: 'bg-emerald-50',
    hoverBorder: 'hover:border-emerald-300',
    to: '/onboarding/term-life',
  },
  {
    key: 'business',
    title: 'Business',
    subtitle: '7 plans · SME packages',
    img: businessImg,
    imgSize: [376, 240],
    bg: 'bg-violet-50',
    hoverBorder: 'hover:border-violet-300',
    to: '/onboarding/business',
  },
  {
    key: 'commercial',
    title: 'Commercial',
    subtitle: '5 plans · property & liability',
    img: commercialImg,
    imgSize: [382, 388],
    bg: 'bg-rose-50',
    hoverBorder: 'hover:border-rose-300',
    to: '/onboarding/commercial',
  },
];

function StepChip({ index, label, active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 shrink-0 ${active ? '' : 'text-on-surface-variant'}`}>
      <span
        className={`w-5 h-5 rounded-full font-data-mono text-[11px] font-semibold flex items-center justify-center ${
          active ? 'bg-primary-container text-white' : 'bg-gray-100 text-on-surface'
        }`}
      >
        {index}
      </span>
      <span className={active ? 'text-on-surface font-semibold' : ''}>{label}</span>
    </span>
  );
}

function OnboardingHero() {
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-gray-200 p-4 sm:p-gutter relative overflow-hidden anim-fade-d1">
      <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary-fixed/20 to-transparent pointer-events-none" />

      <div className="flex flex-wrap justify-between items-start gap-unit mb-gutter relative z-10">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">
            Onboard a customer
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Start a new policy in 3 steps
          </p>
        </div>
        <AppLink
          to="/drafts"
          className="font-data-mono text-data-mono text-primary flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          Resume draft
        </AppLink>
      </div>

      {/*
        Column counts are set by what the rail leaves behind, not by the
        viewport: two-up while the column is ~448px (`md`), three-up at ~488px
        (`lg`), five-up from `xl` where it reaches ~696px and keeps the whole
        row on one line — the shape this hero was drawn for.
      */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-unit sm:gap-gutter mb-gutter relative z-10">
        {PRODUCTS.map((p) => (
          <AppLink
            key={p.key}
            to={p.to}
            className={`group flex flex-col rounded-xl border-2 border-gray-200 bg-white overflow-hidden transition-all hover:shadow-sm ${p.hoverBorder}`}
          >
            <div className={`w-full h-32 ${p.bg} flex items-center justify-center p-2`}>
              <img
                src={p.img}
                alt={`${p.title} insurance`}
                width={p.imgSize[0]}
                height={p.imgSize[1]}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {/* p-3, not the 24px page gutter: these cards are ~145px at their
                narrowest, and gutter padding left 64px for a title that needs
                85. The subtitle wraps rather than truncating for the same
                reason — the grid stretches every card in a row to the tallest,
                so a second line costs nothing. */}
            <div className="p-3">
              <p className="font-body-lg text-body-lg font-semibold text-on-surface">{p.title}</p>
              <p className="font-data-mono text-data-mono text-on-surface-variant">
                {p.subtitle}
              </p>
            </div>
          </AppLink>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-gutter relative z-10 overflow-x-auto no-scrollbar text-body-md font-body-md">
        <StepChip index={1} label="Choose product" />
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 shrink-0">
          arrow_forward
        </span>
        <StepChip index={2} label="Capture details" />
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 shrink-0">
          arrow_forward
        </span>
        <StepChip index={3} label="Generate quote" active />
      </div>
    </section>
  );
}

export default OnboardingHero;
