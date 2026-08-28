function DailyGoalCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-gray-200 p-gutter card-lift anim-fade-d1">
      <div className="flex items-center justify-between mb-gutter">
        <h4 className="font-headline-md text-headline-md text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[20px]">target</span>
          Daily Goal
        </h4>
        <span className="font-label-caps text-label-caps text-primary px-2 py-0.5 rounded-full bg-primary-fixed/40">
          65%
        </span>
      </div>
      <div className="flex justify-between items-end mb-unit">
        <div>
          <span className="font-data-currency text-data-currency text-on-surface text-[22px]">₹32,500</span>
          <span className="font-body-md text-body-md text-on-surface-variant ml-1">/ ₹50,000</span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden mb-unit relative">
        <div className="h-full bg-gradient-to-r from-primary-container to-primary-fixed-dim rounded-full w-[65%] progress-fill relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12" />
        </div>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant">
        Close <span className="font-semibold text-on-surface">1 more term policy</span> to hit target.
      </p>
    </div>
  );
}

const POLICY_TYPES = [
  { name: 'Health', icon: 'favorite',         count: 142, pct: 47, iconBg: 'bg-amber-100',   iconText: 'text-amber-600',   barBg: 'bg-amber-500',   delay: '.1s' },
  { name: 'Motor',  icon: 'directions_car',   count:  89, pct: 29, iconBg: 'bg-sky-100',     iconText: 'text-sky-600',     barBg: 'bg-sky-500',     delay: '.2s' },
  { name: 'Term',   icon: 'shield',           count:  45, pct: 15, iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', barBg: 'bg-emerald-500', delay: '.3s' },
  { name: 'Life',   icon: 'family_restroom',  count:  28, pct:  9, iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  barBg: 'bg-violet-500',  delay: '.4s' },
];

function ActivePoliciesCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-gray-200 p-gutter card-lift anim-fade-d2">
      <div className="flex items-center justify-between mb-gutter">
        <h4 className="font-headline-md text-headline-md text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[20px]">folder_special</span>
          Active Policies
        </h4>
        <span className="font-data-mono text-data-mono text-on-surface-variant">304 total</span>
      </div>
      <ul className="flex flex-col gap-gutter">
        {POLICY_TYPES.map((p) => (
          <li key={p.name}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-body-md text-body-md text-on-surface flex items-center gap-unit">
                <span className={`w-7 h-7 rounded-full ${p.iconBg} ${p.iconText} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                </span>
                {p.name}
              </span>
              <span className="font-data-currency text-data-currency text-on-surface">{p.count}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${p.barBg} rounded-full progress-fill`}
                style={{ width: `${p.pct}%`, animationDelay: p.delay }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DOMAIN_SALES = [
  { name: 'Health', value: '₹4.5L', pct: '37.5%', dot: 'bg-amber-500' },
  { name: 'Motor',  value: '₹3.5L', pct: '29.2%', dot: 'bg-sky-500' },
  { name: 'Term',   value: '₹2.5L', pct: '20.8%', dot: 'bg-emerald-500' },
  { name: 'Life',   value: '₹1.5L', pct: '12.5%', dot: 'bg-violet-500' },
];

function SalesByDomainCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-gutter card-lift anim-fade-d3">
      <div className="flex items-center justify-between mb-gutter">
        <h4 className="font-headline-md text-headline-md text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-violet-600 text-[20px]">donut_small</span>
          Sales by Domain
        </h4>
        <span className="font-label-caps text-label-caps text-on-surface-variant">This month</span>
      </div>

      <div className="relative w-[160px] h-[160px] mx-auto mb-gutter group">
        <div
          className="absolute inset-0 rounded-full transition-transform group-hover:scale-105 shadow-[0_4px_16px_-8px_rgba(0,0,0,.15)]"
          style={{
            background: 'conic-gradient(#f59e0b 0deg 135deg, #0ea5e9 135deg 240deg, #10b981 240deg 315deg, #8b5cf6 315deg 360deg)',
          }}
        />
        <div className="absolute inset-[20px] rounded-full bg-white flex flex-col items-center justify-center">
          <span className="font-data-currency text-data-currency text-on-surface text-[22px]">₹12L</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant mt-0.5">TOTAL SALES</span>
        </div>
      </div>

      <ul className="flex flex-col gap-unit">
        {DOMAIN_SALES.map((d) => (
          <li
            key={d.name}
            className="flex items-center justify-between gap-unit py-1 hover:bg-gray-50 px-1.5 -mx-1.5 rounded transition-colors"
          >
            <span className="flex items-center gap-unit min-w-0">
              <span className={`w-2.5 h-2.5 rounded-sm ${d.dot} shrink-0`} />
              <span className="font-body-md text-body-md text-on-surface truncate">{d.name}</span>
            </span>
            <span className="flex items-center gap-unit shrink-0">
              <span className="font-data-currency text-data-currency text-on-surface">{d.value}</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant w-9 text-right">{d.pct}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const LEARN_ITEMS = [
  { title: 'Selling Term Insurance 101', meta: 'Video · 8 min',       icon: 'play_circle', iconBg: 'bg-rose-100',    iconText: 'text-rose-600' },
  { title: 'New IRDAI Guidelines 2024',  meta: 'Article · 5 min read', icon: 'article',     iconBg: 'bg-sky-100',     iconText: 'text-sky-600' },
  { title: 'Product Knowledge Quiz',     meta: 'Quiz · earn 50 XP',    icon: 'quiz',        iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
];

function LearnGrowCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-gray-200 p-gutter card-lift anim-fade-d4">
      <h4 className="font-headline-md text-headline-md text-on-surface mb-gutter flex items-center gap-1.5">
        <span className="material-symbols-outlined text-emerald-600 text-[20px]">school</span>
        Learn &amp; Grow
      </h4>
      <ul className="flex flex-col gap-unit">
        {LEARN_ITEMS.map((item) => (
          <li
            key={item.title}
            // p-4/gap-3 rather than the page gutter: in the 20rem rail this row
            // has ~240px to work with, and 24px of padding on each side plus a
            // 24px gap would spend a third of it before the title starts.
            className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 hover:bg-gray-100 hover:translate-x-0.5 transition-all cursor-pointer border border-gray-200"
          >
            <div className={`w-9 h-9 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined ${item.iconText} text-[18px]`}>{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body-md text-body-md text-on-surface line-clamp-1">{item.title}</p>
              <p className="font-data-mono text-data-mono text-on-surface-variant">{item.meta}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A 20rem rail from `2xl` up (see the note in OverviewPage for why not `xl`).
 * Below that it sits under the main column, where a single stack of four
 * full-width cards would be a long scroll for very little information — so it
 * pairs up from `sm` and only returns to one column once it is the narrow rail
 * again. `items-start` keeps each card at its natural height instead of
 * stretching the short ones to match their row.
 */
function RightRail() {
  return (
    <div className="w-full 2xl:w-80 shrink-0 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-1 items-start gap-gutter">
      <DailyGoalCard />
      <ActivePoliciesCard />
      <SalesByDomainCard />
      <LearnGrowCard />
    </div>
  );
}

export default RightRail;
