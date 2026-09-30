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

// Uses the icon name from the server first, then guesses from the code or name.
export const iconFor = (lob) => {
  const fromServer = biIcon(lob.icon);
  if (fromServer) return fromServer;

  const key = `${lob.icon ?? ''} ${lob.code ?? ''} ${lob.name ?? ''}`.toLowerCase();
  return ICON_MATCHES.find(([pattern]) => pattern.test(key))?.[1] ?? ShieldCheck;
};
