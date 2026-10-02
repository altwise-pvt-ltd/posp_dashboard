import { ClipboardCheck, FilePlus, FileX, Files, PenLine } from 'lucide-react';
import iconMarketing from '@/assets/sidebar/marketing.webp';
import iconReports from '@/assets/sidebar/Reports.webp';
import iconRenewal from '@/assets/sidebar/renewal.webp';
import iconClaim from '@/assets/sidebar/claim.webp';
import iconTicket from '@/assets/sidebar/support-ticket.webp';

// The two choices behind the Quote tab.
export const QUOTE_ITEMS = [
  {
    label: 'Create Quotation',
    description: 'Start a new quote for a customer',
    to: '/offline-quotation/create',
    icon: FilePlus,
  },
  {
    label: 'View Quotations',
    description: 'See the quotes you have raised',
    to: '/offline-quotation/view',
    icon: Files,
  },
];

// Everything the bottom bar has no tab for. `image` is an illustration from
// assets/sidebar; `icon` is a lucide stand-in until one is added.
export const MORE_ITEMS = [
  { label: 'Marketing Kit', to: '/marketing-kit', image: iconMarketing },
  { label: 'Reports', to: '/reports', image: iconReports },
  { label: 'Renewal', to: '/renewal', image: iconRenewal },
  { label: 'Claim', to: '/claim', image: iconClaim },
  { label: 'Endorsement', to: '/endorsement', icon: PenLine },
  { label: 'Inspection', to: '/inspection', icon: ClipboardCheck },
  { label: 'Cancellation', to: '/cancellation', icon: FileX },
  { label: 'Ticket', to: '/ticket', image: iconTicket },
];
