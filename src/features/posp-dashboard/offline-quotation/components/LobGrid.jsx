import {
  Bandage,
  Banknote,
  BriefcaseBusiness,
  Building2,
  Car,
  FileText,
  Flame,
  Globe,
  HeartPulse,
  Hospital,
  House,
  Package,
  Plane,
  Ship,
  ShieldCheck,
  Store,
  TriangleAlert,
  Truck,
  Umbrella,
  Users,
} from 'lucide-react';

const BI_ICONS = {
  airplane: Plane,
  bandaid: Bandage,
  bank: Banknote,
  box: Package,
  boxes: Package,
  briefcase: BriefcaseBusiness,
  building: Building2,
  buildings: Building2,
  car: Car,
  cash: Banknote,
  clipboard: FileText,
  currency: Banknote,
  exclamation: TriangleAlert,
  file: FileText,
  fire: Flame,
  globe: Globe,
  heart: HeartPulse,
  hospital: Hospital,
  house: House,
  houses: House,
  luggage: Plane,
  people: Users,
  person: Users,
  shield: ShieldCheck,
  shop: Store,
  truck: Truck,
  tsunami: Ship,
  umbrella: Umbrella,
  water: Ship,
};

const ICON_MATCHES = [
  [/motor|vehicle|car|bike|auto/, Car],
  [/health|medical|mediclaim/, HeartPulse],
  [/life|term/, Umbrella],
  [/travel/, Plane],
  [/home|property|fire|house|shop/, House],
  [/marine|cargo|ship/, Ship],
];

const biIcon = (icon) => {
  const name = String(icon ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .pop();
  return BI_ICONS[name.replace(/^bi-/, '').split('-')[0]] ?? null;
};

const iconFor = (lob) => {
  const fromServer = biIcon(lob.icon);
  if (fromServer) return fromServer;

  const key = `${lob.icon ?? ''} ${lob.code ?? ''} ${lob.name ?? ''}`.toLowerCase();
  return ICON_MATCHES.find(([pattern]) => pattern.test(key))?.[1] ?? ShieldCheck;
};

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
            className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 ${
              active
                ? 'border-primary bg-primary-fixed/30 shadow-[0_10px_24px_-16px_rgba(255,107,0,0.65)]'
                : 'border-gray-200 bg-white hover:-translate-y-0.5 hover:border-orange-200'
            }`}
          >
            <span
              className={`flex size-9 items-center justify-center rounded-lg transition-colors duration-200 ${
                active ? 'bg-primary-container text-white' : 'bg-orange-50 text-primary'
              }`}
            >
              <Icon size={18} />
            </span>

            <span className="font-body-lg text-body-lg font-semibold text-on-surface">
              {lob.name}
            </span>

            <span className="font-body-md text-body-md text-on-surface-variant">
              {count} {count === 1 ? 'product' : 'products'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default LobGrid;
