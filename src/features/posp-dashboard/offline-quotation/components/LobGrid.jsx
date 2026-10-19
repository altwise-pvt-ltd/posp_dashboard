import { Check } from 'lucide-react';
import { useCatalogImage } from '../hooks/useCatalogImage';
import LobIcon from './LobIcon';

const lobKey = (entry) => entry?.id ?? entry?.code ?? null;

function LobTile({ lob, active, onSelect }) {
  const image = useCatalogImage(lob.imageUrl);

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={`group flex min-w-0 items-center gap-2 rounded-xl border bg-white py-2 pr-2 pl-3 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
        active ? 'border-primary bg-primary-fixed/15' : 'border-hairline hover:border-primary/50'
      }`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1">
        <span className="font-body-lg text-body-lg line-clamp-2 min-w-0 font-semibold tracking-tight wrap-break-word text-on-surface">
          {lob.name}
        </span>
        {active && (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Check size={10} strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </span>

      {/* Fixed-size well, so every card is the same height whether or not its image has loaded. */}
      <span className="flex size-[72px] shrink-0 items-center justify-center">
        {image ? (
          <img
            src={image}
            alt=""
            className="pointer-events-none size-full object-contain mix-blend-multiply transition-opacity duration-300 starting:opacity-0"
          />
        ) : (
          <LobIcon lob={lob} size={24} className="size-6 text-primary" />
        )}
      </span>
    </button>
  );
}

function LobGrid({ lobs, selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {lobs.map((lob) => {
        const key = lobKey(lob);

        return (
          <LobTile
            key={key ?? lob.name}
            lob={lob}
            active={key !== null && key === selected}
            onSelect={() => onSelect(key)}
          />
        );
      })}
    </div>
  );
}

export default LobGrid;
