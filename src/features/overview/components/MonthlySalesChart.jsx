import { useState } from 'react';

const SEGMENTS = [
  { key: 'amber',   bg: 'bg-amber-500' },
  { key: 'sky',     bg: 'bg-sky-500' },
  { key: 'emerald', bg: 'bg-emerald-500' },
  { key: 'violet',  bg: 'bg-violet-500' },
];

const DATASETS = {
  Self: {
    yLeft:  ['₹12L', '₹9L', '₹6L', '₹3L', '₹0'],
    yRight: ['100', '75', '50', '25', '0'],
    months: [
      {
        label: 'Jan',
        business: { height: 33,  parts: [37.5, 30,   20,   12.5], tooltip: '₹4.0L', delay: '.05s' },
        cases:    { height: 30,  parts: [42.9, 28.6, 17.9, 10.7], tooltip: '28',    delay: '.08s' },
      },
      {
        label: 'Feb',
        business: { height: 54,  parts: [33.8, 27.7, 23.1, 15.4], tooltip: '₹6.5L', delay: '.12s' },
        cases:    { height: 52,  parts: [37.5, 29.2, 20.8, 12.5], tooltip: '48',    delay: '.15s' },
      },
      {
        label: 'Mar',
        business: { height: 100, parts: [37.5, 29.2, 20.8, 12.5], tooltip: '₹12.0L', delay: '.19s' },
        cases:    { height: 100, parts: [37.6, 30.1, 19.4, 12.9], tooltip: '93',     delay: '.22s' },
        peak: true,
      },
      {
        label: 'Apr',
        business: { height: 46,  parts: [36.4, 27.3, 21.8, 14.5], tooltip: '₹5.5L', delay: '.26s' },
        cases:    { height: 44,  parts: [39,   29.3, 19.5, 12.2], tooltip: '41',    delay: '.29s' },
      },
      {
        label: 'May',
        business: { height: 70,  parts: [35.7, 29.8, 21.4, 13.1], tooltip: '₹8.4L', delay: '.33s' },
        cases:    { height: 71,  parts: [36.4, 30.3, 21.2, 12.1], tooltip: '66',    delay: '.36s' },
      },
      {
        label: 'Jun',
        business: { height: 84,  parts: [37.6, 29.7, 19.8, 12.9], tooltip: '₹10.1L', delay: '.40s' },
        cases:    { height: 86,  parts: [37.5, 30,   20,   12.5], tooltip: '80',     delay: '.43s' },
      },
    ],
  },
  Team: {
    yLeft:  ['₹40L', '₹30L', '₹20L', '₹10L', '₹0'],
    yRight: ['320', '240', '160', '80', '0'],
    months: [
      {
        label: 'Jan',
        business: { height: 38, parts: [36, 30,   21,   13], tooltip: '₹14.5L', delay: '.05s' },
        cases:    { height: 31, parts: [40, 29,   19,   12], tooltip: '96',     delay: '.08s' },
      },
      {
        label: 'Feb',
        business: { height: 58, parts: [35, 28,   22,   15], tooltip: '₹22.0L', delay: '.12s' },
        cases:    { height: 54, parts: [38, 29,   21,   12], tooltip: '168',    delay: '.15s' },
      },
      {
        label: 'Mar',
        business: { height: 100, parts: [37.5, 29.2, 20.8, 12.5], tooltip: '₹38.0L', delay: '.19s' },
        cases:    { height: 100, parts: [37.6, 30.1, 19.4, 12.9], tooltip: '312',    delay: '.22s' },
        peak: true,
      },
      {
        label: 'Apr',
        business: { height: 49, parts: [36, 27,   22,   15], tooltip: '₹18.5L', delay: '.26s' },
        cases:    { height: 45, parts: [39, 29,   20,   12], tooltip: '140',    delay: '.29s' },
      },
      {
        label: 'May',
        business: { height: 76, parts: [36, 30,   21,   13], tooltip: '₹29.0L', delay: '.33s' },
        cases:    { height: 72, parts: [36, 30,   21,   13], tooltip: '224',    delay: '.36s' },
      },
      {
        label: 'Jun',
        business: { height: 88, parts: [38, 30,   20,   12], tooltip: '₹33.5L', delay: '.40s' },
        cases:    { height: 87, parts: [38, 30,   20,   12], tooltip: '270',    delay: '.43s' },
      },
    ],
  },
};

function StackedBar({ data, kind, peak }) {
  const isB = kind === 'B';
  return (
    <div
      className={`relative w-5 sm:w-7 flex flex-col-reverse rounded-t overflow-hidden bar-grow ${
        isB ? '' : 'opacity-60 ring-1 ring-gray-300/40'
      } ${peak ? `ring-1 ${isB ? 'ring-primary/40' : 'ring-primary/30'}` : ''}`}
      style={{ height: `${data.height}%`, animationDelay: data.delay }}
    >
      {SEGMENTS.map((s, i) => (
        <div key={s.key} className={s.bg} style={{ height: `${data.parts[i]}%` }} />
      ))}
      <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-[11px] py-1 px-2 rounded pointer-events-none transition-opacity font-data-mono whitespace-nowrap shadow-lg">
        {kind} · {data.tooltip}
      </div>
    </div>
  );
}

function MonthlySalesChart() {
  const [scope, setScope] = useState('Self');
  const { months, yLeft, yRight } = DATASETS[scope];

  return (
    <section className="bg-surface-container-lowest rounded-xl border border-gray-200 p-gutter anim-fade-d4">
      <div className="flex flex-wrap justify-between items-center gap-unit mb-gutter">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sky-600 text-[22px]">bar_chart</span>
            Monthly Sales
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Premium booked · last 6 months
          </p>
        </div>
        <div className="flex bg-surface-container rounded-full p-1 border border-gray-200">
          {['Self', 'Team'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setScope(opt)}
              className={`px-gutter py-1 rounded-full font-body-md text-body-md transition-colors ${
                scope === opt
                  ? 'bg-surface-container-lowest shadow-sm text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-gutter mb-unit">
        <div className="flex items-center gap-unit flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Health
          </span>
          <span className="inline-flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Motor
          </span>
          <span className="inline-flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Term
          </span>
          <span className="inline-flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" /> Life
          </span>
        </div>
        <div className="ml-auto flex items-center gap-unit font-data-mono text-[11px] text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gray-300" />B = Business (₹L)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300" />C = Cases
          </span>
        </div>
      </div>

      <div className="relative h-64 mb-unit">
        <div className="absolute inset-y-0 left-0 w-10 flex flex-col justify-between pointer-events-none">
          {yLeft.map((v) => (
            <span key={v} className="font-data-mono text-[11px] text-on-surface-variant/70 -translate-y-1.5">{v}</span>
          ))}
        </div>
        <div className="absolute inset-y-0 right-0 w-8 flex flex-col justify-between pointer-events-none text-right">
          {yRight.map((v) => (
            <span key={v} className="font-data-mono text-[11px] text-on-surface-variant/70 -translate-y-1.5">{v}</span>
          ))}
        </div>
        <div className="absolute inset-y-0 left-10 right-8 flex flex-col justify-between pointer-events-none">
          <div className="border-t border-dashed border-gray-200" />
          <div className="border-t border-dashed border-gray-200" />
          <div className="border-t border-dashed border-gray-200" />
          <div className="border-t border-dashed border-gray-200" />
          <div className="border-t border-gray-300" />
        </div>

        <div key={scope} className="relative h-full flex items-end justify-between gap-1 pl-10 pr-8">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
              <div className="flex items-end gap-1 w-full justify-center h-full pt-4 relative">
                {m.peak && (
                  <div className="absolute -top-1 left-0 right-0 mx-auto text-center font-data-mono text-[10px] text-primary font-semibold pointer-events-none whitespace-nowrap">
                    peak
                  </div>
                )}
                <StackedBar data={m.business} kind="B" peak={m.peak} />
                <StackedBar data={m.cases} kind="C" peak={m.peak} />
              </div>
              <span className={`font-data-mono text-[11px] ${m.peak ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-violet-50 to-sky-50 rounded-xl p-gutter flex items-start gap-gutter border border-gray-200">
        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-violet-600 text-[20px]">auto_awesome</span>
        </div>
        <div className="flex-1">
          <p className="font-label-caps text-label-caps text-violet-600 mb-1">AI INSIGHT</p>
          <p className="font-body-md text-body-md text-on-surface">
            March was your best month, driven by a <span className="font-semibold">40% increase</span> in
            Health insurance policies. Consider revisiting leads from that period for term renewals.
          </p>
        </div>
      </div>
    </section>
  );
}

export default MonthlySalesChart;
