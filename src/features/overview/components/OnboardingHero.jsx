import { createElement } from 'react';
import { RefreshCw } from 'lucide-react';
import AppLink from '@/shared/components/AppLink';
import { useQuoteCatalog } from '@/features/posp-dashboard/offline-quotation/hooks/useQuoteCatalog';
import { iconFor } from '@/features/posp-dashboard/offline-quotation/lib/lobIcon';

const CREATE_QUOTE_PATH = '/offline-quotation/create';

// Only the first five lines of business are shown here.
const VISIBLE_LOBS = 5;

const TINTS = [
  {
    bg: 'bg-amber-50',
    hoverBorder: 'hover:border-amber-300',
    ink: 'text-amber-600',
    wash: 'from-amber-50 to-amber-100',
    edge: 'border-amber-200/70',
  },
  {
    bg: 'bg-sky-50',
    hoverBorder: 'hover:border-sky-300',
    ink: 'text-sky-600',
    wash: 'from-sky-50 to-sky-100',
    edge: 'border-sky-200/70',
  },
  {
    bg: 'bg-emerald-50',
    hoverBorder: 'hover:border-emerald-300',
    ink: 'text-emerald-600',
    wash: 'from-emerald-50 to-emerald-100',
    edge: 'border-emerald-200/70',
  },
  {
    bg: 'bg-violet-50',
    hoverBorder: 'hover:border-violet-300',
    ink: 'text-violet-600',
    wash: 'from-violet-50 to-violet-100',
    edge: 'border-violet-200/70',
  },
  {
    bg: 'bg-rose-50',
    hoverBorder: 'hover:border-rose-300',
    ink: 'text-rose-600',
    wash: 'from-rose-50 to-rose-100',
    edge: 'border-rose-200/70',
  },
];

// Picks a colour set by position, starting over after the last one.
const tintAt = (index) => TINTS[index % TINTS.length];

const lobKey = (lob) => lob.id ?? lob.code ?? lob.name;

// Links to the create page with this line of business already picked.
const quoteLinkFor = (lob) => `${CREATE_QUOTE_PATH}?lob=${encodeURIComponent(lob.code ?? lob.id)}`;

const productCount = (lob) => {
  const count = lob.products.length;
  return `${count} ${count === 1 ? 'product' : 'products'}`;
};

const productNames = (lob, limit = Infinity) =>
  lob.products
    .slice(0, limit)
    .map((p) => p.name)
    .filter(Boolean)
    .join(', ');

const subtitleFor = (lob) => {
  const names = productNames(lob, 2);
  return names ? `${productCount(lob)} · ${names}` : productCount(lob);
};

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

function LobCard({ lob, index }) {
  const tint = tintAt(index);

  return (
    <AppLink
      to={quoteLinkFor(lob)}
      className={`group flex flex-col rounded-xl border-2 border-gray-200 bg-white overflow-hidden transition-all hover:shadow-sm ${tint.hoverBorder}`}
    >
      <div className={`w-full h-32 ${tint.bg} flex items-center justify-center p-2`}>
        {createElement(iconFor(lob), {
          size: 56,
          strokeWidth: 1.5,
          'aria-hidden': true,
          className: `${tint.ink} transition-transform duration-300 group-hover:scale-105`,
        })}
      </div>
      <div className="p-3">
        <p className="font-body-lg text-body-lg font-semibold text-on-surface">{lob.name}</p>
        <p className="font-data-mono text-data-mono text-on-surface-variant line-clamp-2">
          {subtitleFor(lob)}
        </p>
      </div>
    </AppLink>
  );
}

function LobCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border-2 border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="w-full h-32 bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-2/3 rounded bg-gray-100" />
        <div className="h-3 w-5/6 rounded bg-gray-100" />
      </div>
    </div>
  );
}

// For each number of lines of business (1 to 5): whether each tile is tall
// or short, and where it sits in the grid.
const BENTO_LAYOUTS = {
  5: {
    grid: 'grid-rows-[repeat(6,44px)] max-[399px]:grid-rows-[repeat(6,52px)]',
    tiles: [
      ['tall', 'col-start-1 row-start-1 row-span-3'],
      ['tall', 'col-start-1 row-start-4 row-span-3'],
      ['short', 'col-start-2 row-start-1 row-span-2'],
      ['short', 'col-start-2 row-start-3 row-span-2'],
      ['short', 'col-start-2 row-start-5 row-span-2'],
    ],
  },
  4: {
    grid: 'auto-rows-[100px] max-[399px]:auto-rows-[114px]',
    tiles: [['short'], ['short'], ['short'], ['short']],
  },
  3: {
    grid: 'grid-rows-[repeat(2,100px)] max-[399px]:grid-rows-[repeat(2,114px)]',
    tiles: [
      ['tall', 'col-start-1 row-start-1 row-span-2'],
      ['short', 'col-start-2 row-start-1'],
      ['short', 'col-start-2 row-start-2'],
    ],
  },
  2: {
    grid: 'auto-rows-[100px] max-[399px]:auto-rows-[114px]',
    tiles: [['short'], ['short']],
  },
  1: {
    grid: 'auto-rows-[100px] max-[399px]:auto-rows-[114px]',
    tiles: [['short', 'col-span-2']],
  },
};

function BentoTile({ lob, index, variant, placement = '' }) {
  const tint = tintAt(index);
  const tall = variant === 'tall';
  const icon = iconFor(lob);
  const names = tall ? productNames(lob) : '';

  return (
    <AppLink
      to={quoteLinkFor(lob)}
      className={`relative isolate flex min-w-0 overflow-hidden rounded-xl border bg-linear-to-br p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_10px_22px_-12px_rgba(15,23,42,0.28)] transition-[transform,box-shadow] duration-150 active:translate-y-px active:scale-[0.98] active:shadow-[0_1px_2px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
        tint.wash
      } ${tint.edge} ${
        tall
          ? 'flex-col justify-between'
          : 'items-center gap-2.5 max-[399px]:flex-col max-[399px]:items-start max-[399px]:justify-between max-[399px]:gap-0'
      } ${placement}`}
    >
      {createElement(icon, {
        'aria-hidden': true,
        strokeWidth: 1.5,
        className: `pointer-events-none absolute -z-10 -rotate-12 opacity-[0.14] ${tint.ink} ${
          tall ? '-right-5 -bottom-5 size-28' : '-right-3 -bottom-4 size-20'
        }`,
      })}

      {createElement(icon, {
        'aria-hidden': true,
        className: `shrink-0 ${tint.ink} ${tall ? 'size-7' : 'size-6'}`,
      })}

      <span className="flex min-w-0 flex-col">
        <span
          className={`line-clamp-2 wrap-break-word font-semibold text-on-surface ${
            tall ? 'font-body-lg text-body-lg' : 'font-body-md text-body-md'
          }`}
        >
          {lob.name}
        </span>
        <span className="truncate font-data-mono text-data-mono text-on-surface-variant">
          {productCount(lob)}
        </span>
        {names && (
          <span className="truncate font-data-mono text-data-mono text-on-surface-variant">
            {names}
          </span>
        )}
      </span>
    </AppLink>
  );
}

function BentoGrid({ lobs }) {
  const layout = BENTO_LAYOUTS[lobs.length];

  return (
    <div className={`grid grid-cols-2 gap-3 lg:hidden ${layout.grid}`}>
      {lobs.map((lob, i) => (
        <BentoTile
          key={lobKey(lob)}
          lob={lob}
          index={i}
          variant={layout.tiles[i][0]}
          placement={layout.tiles[i][1]}
        />
      ))}
    </div>
  );
}

function BentoSkeleton() {
  const { grid, tiles } = BENTO_LAYOUTS[VISIBLE_LOBS];

  return (
    <div className={`grid grid-cols-2 gap-3 lg:hidden ${grid}`} aria-hidden="true">
      {tiles.map(([, placement], i) => (
        <div
          key={i}
          className={`animate-pulse rounded-xl border border-gray-200 bg-gray-100 ${placement}`}
        />
      ))}
    </div>
  );
}

function LobCards() {
  const { catalog, loading, error, retry } = useQuoteCatalog();

  if (error || (!loading && catalog.length === 0)) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-unit rounded-xl border border-dashed border-gray-300 p-4 mb-gutter relative z-10">
        <p className="font-body-md text-body-md text-on-surface-variant">
          {error
            ? "Couldn't load the products you can quote."
            : 'No lines of business have been published for your account yet.'}
        </p>
        <button
          type="button"
          onClick={retry}
          className="font-data-mono text-data-mono text-primary flex items-center gap-1 hover:underline"
        >
          <RefreshCw size={14} aria-hidden="true" />
          {error ? 'Try again' : 'Refresh'}
        </button>
      </div>
    );
  }

  const visible = catalog.slice(0, VISIBLE_LOBS);

  return (
    <div className="mb-gutter relative z-10">
      {loading ? <BentoSkeleton /> : <BentoGrid lobs={visible} />}

      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-5 gap-unit sm:gap-gutter">
        {loading
          ? Array.from({ length: VISIBLE_LOBS }, (_, i) => <LobCardSkeleton key={i} />)
          : visible.map((lob, i) => (
              <LobCard key={lobKey(lob)} lob={lob} index={i} />
            ))}
      </div>

      {!loading && (
        <div className="flex justify-end mt-unit">
          <AppLink
            to={CREATE_QUOTE_PATH}
            className="font-data-mono text-data-mono text-primary flex items-center gap-1 hover:underline min-h-[44px] px-2 -mr-2 lg:min-h-0 lg:px-0 lg:mr-0"
          >
            See more
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </AppLink>
        </div>
      )}
    </div>
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

      <LobCards />

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
