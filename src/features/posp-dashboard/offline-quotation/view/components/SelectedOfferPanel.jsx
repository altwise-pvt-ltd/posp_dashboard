import { BadgeCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '@/shared/lib/format';

function Fact({ label, children, mono = false }) {
  return (
    <div className="min-w-0">
      <dt className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
        {label}
      </dt>
      <dd
        className={`mt-0.5 break-words text-on-surface ${
          mono ? 'font-data-mono text-body-lg font-semibold' : 'font-body-lg text-body-lg'
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

/** The insurer response the agent accepted, and the proposal raised on it. */
function SelectedOfferPanel({ offer }) {
  const {
    insurerName,
    insurerQuoteRef,
    premium,
    idv,
    odPremium,
    tpPremium,
    validTill,
    proposalNumber,
    proposalStatus,
    acceptedAt,
  } = offer;

  return (
    <section className="anim-fade-d2 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Selected policy</h3>
          <p className="font-body-md text-body-md mt-0.5 text-on-surface-variant">
            The insurer response you accepted
            {acceptedAt && <> on {formatDate(acceptedAt)}</>}.
          </p>
        </div>

        <span className="font-label-caps text-status-pill inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-orange-700 ring-1 ring-orange-200">
          <BadgeCheck aria-hidden="true" className="size-3.5" />
          Selected
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 rounded-xl border border-gray-200 bg-surface-dim/40 p-3.5">
        <div className="min-w-0">
          <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
            Insurer
          </p>
          <p className="font-headline-md text-headline-md mt-0.5 text-on-surface">
            {insurerName ?? '—'}
          </p>
          {insurerQuoteRef && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Insurer ref <span className="font-data-mono text-on-surface">{insurerQuoteRef}</span>
            </p>
          )}
        </div>

        <div className="sm:text-right">
          <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
            Premium
          </p>
          <p className="font-data-currency text-headline-lg mt-0.5 text-on-surface">
            {formatCurrency(premium)}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {proposalNumber && (
          <Fact label="Proposal no." mono>
            {proposalNumber}
          </Fact>
        )}
        {proposalStatus && <Fact label="Proposal status">{proposalStatus}</Fact>}
        {idv !== null && <Fact label="IDV">{formatCurrency(idv)}</Fact>}
        {odPremium !== null && <Fact label="OD premium">{formatCurrency(odPremium)}</Fact>}
        {tpPremium !== null && <Fact label="TP premium">{formatCurrency(tpPremium)}</Fact>}
        {validTill && <Fact label="Valid till">{formatDate(validTill)}</Fact>}
      </dl>
    </section>
  );
}

export default SelectedOfferPanel;
