import { CalendarClock, ShieldCheck, Wallet } from 'lucide-react';
import { formatCompactCurrency } from '@/shared/lib/format';
import { EXPIRY_WINDOW_DAYS } from '../lib/policyFilters';

/**
 * The three figures above the list — what makes this a book of business rather
 * than a second record table.
 *
 * Three, and specifically *these* three. `QuotationFilters` argues that chips
 * carrying their own counts are why that screen needs no summary tiles, and it
 * is right: repeating "Active · 6" here when the chip below already says it
 * would put the same number on screen twice. So nothing here is a status count.
 * Each tile answers something the chips structurally cannot — two of them are
 * money, and the third is a date window, which is not a status at all.
 *
 * Every figure is computed from the same rows the table renders (see
 * `usePolicyList`), so the strip can never disagree with the list beneath it
 * and needs no endpoint of its own.
 */

function Tile({ icon: Icon, tone, label, value, note }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3.5 sm:p-4">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon aria-hidden="true" className="size-4.5" />
      </span>

      <div className="min-w-0">
        <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
          {label}
        </p>
        {/* `font-data-currency` carries the tabular-figure setting, so the three
            tiles' numbers share a baseline grid even at different lengths. */}
        <p className="font-data-currency text-headline-md text-on-surface">{value}</p>
        <p className="font-body-md text-body-md truncate text-on-surface-variant">{note}</p>
      </div>
    </div>
  );
}

function PolicySummary({ summary }) {
  const { booked, active, expiring, total } = summary;

  return (
    <div className="grid grid-cols-1 gap-unit sm:grid-cols-3 md:gap-gutter">
      <Tile
        icon={Wallet}
        tone="bg-sky-50 text-sky-600"
        label="Premium booked"
        value={formatCompactCurrency(booked)}
        note={`Across ${total} ${total === 1 ? 'policy' : 'policies'}`}
      />

      <Tile
        icon={ShieldCheck}
        tone="bg-emerald-50 text-emerald-600"
        label="Cover in force"
        // Premium, not a count — the Active chip below already carries the
        // count, and this is the figure it cannot show.
        value={formatCompactCurrency(active)}
        note="Premium on active policies"
      />

      <Tile
        icon={CalendarClock}
        tone="bg-orange-50 text-primary"
        label="Renewals due"
        value={expiring}
        note={`Expiring within ${EXPIRY_WINDOW_DAYS} days`}
      />
    </div>
  );
}

export default PolicySummary;
