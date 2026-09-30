import { ArrowUpRight } from 'lucide-react';
import { iconFor } from '../lib/lobIcon';

const lobKey = (entry) => entry?.id ?? entry?.code ?? null;

function LobGrid({ lobs, selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-unit sm:grid-cols-3 xl:grid-cols-4">
      {lobs.map((lob) => {
        const key = lobKey(lob);
        const Icon = iconFor(lob);
        const active = key !== null && key === selected;
        const count = lob.products.length;

        return (
          <button
            key={key ?? lob.name}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(key)}
            className={`group flex flex-col justify-between gap-4 rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
              active
                ? 'border-primary bg-primary-fixed/30 shadow-[0_10px_24px_-16px_rgba(255,107,0,0.65)]'
                : 'border-slate-200 bg-linear-to-br from-white to-orange-50/50 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_20px_-12px_rgba(222,123,61,0.28)] hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_16px_32px_-14px_rgba(255,107,0,0.45)]'
            }`}
          >
            <span className="flex w-full items-start justify-between gap-2">
              <span className="font-body-lg text-body-lg font-semibold text-on-surface">
                {lob.name}
              </span>

              <ArrowUpRight
                size={18}
                aria-hidden="true"
                className={`mt-0.5 shrink-0 text-primary transition-all duration-200 ${
                  active
                    ? 'opacity-100'
                    : 'opacity-0 -translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100'
                }`}
              />
            </span>

            <span className="flex w-full items-end justify-between gap-2">
              <span className="font-body-md text-body-md text-on-surface-variant">
                {count} {count === 1 ? 'product' : 'products'}
              </span>

              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
                  active
                    ? 'bg-primary-container text-white'
                    : 'bg-orange-100/80 text-primary ring-1 ring-orange-200/70 group-hover:bg-primary-container group-hover:text-white group-hover:ring-transparent'
                }`}
              >
                <Icon size={20} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default LobGrid;
