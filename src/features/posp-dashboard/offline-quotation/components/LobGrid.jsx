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
      className={`group flex flex-col rounded-xl border bg-white p-2 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
        active ? 'border-primary bg-primary-fixed/15' : 'border-hairline hover:border-primary/50'
      }`}
    >
      {/* Fixed-ratio well, so every card is the same height whether or not its image has loaded. */}
      <span className="relative flex aspect-16/10 w-full items-center justify-center rounded-lg bg-surface-container-low p-3">
        {image ? (
          <img
            src={image}
            alt=""
            className="pointer-events-none transition-opacity duration-300 starting:opacity-0 size-full object-contain mix-blend-multiply"
          />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-full bg-white text-primary ring-1 ring-hairline">
            <LobIcon lob={lob} size={24} className="size-6" />
          </span>
        )}

        {active && (
          <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-white">
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </span>

      {/* Two lines reserved, so labels share a top edge and long names don't change the height. */}
      <span className="px-1 pt-2">
        <span className="font-body-lg text-body-lg line-clamp-2 h-[2lh] font-semibold tracking-tight text-on-surface">
          {lob.name}
        </span>
      </span>
    </button>
  );
}

function LobGrid({ lobs, selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
