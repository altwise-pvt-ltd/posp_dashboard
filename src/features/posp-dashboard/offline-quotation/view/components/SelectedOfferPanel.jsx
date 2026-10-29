import { BadgeCheck } from 'lucide-react';
import { formatCurrencyPreserve, formatDate } from '@/shared/lib/format';
import EarningStrip from './EarningStrip';
import { PANEL, PANEL_TITLE } from '../lib/panel';
import Fact, { FACT_LABEL } from './Fact';

function SelectedOfferPanel({ offer, earning }) {
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
    <section className={PANEL}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={PANEL_TITLE}>Selected policy</h3>
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

      {(insurerName || insurerQuoteRef || Number.isFinite(premium)) && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 rounded-xl border border-hairline bg-surface-dim/40 p-3.5">
          {(insurerName || insurerQuoteRef) && (
            <div className="min-w-0">
              {insurerName && (
                <>
                  <p className={FACT_LABEL}>
                    Insurer
                  </p>
                  <p className="font-headline-md text-headline-md mt-0.5 text-on-surface">
                    {insurerName}
                  </p>
                </>
              )}
              {insurerQuoteRef && (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Insurer ref <span className="font-data-mono text-on-surface">{insurerQuoteRef}</span>
                </p>
              )}
            </div>
          )}

          {Number.isFinite(premium) && (
            <div className="sm:text-right">
              <p className={FACT_LABEL}>
                Premium
              </p>
              <p className="font-data-currency text-headline-lg mt-0.5 text-on-surface">
                {formatCurrencyPreserve(premium)}
              </p>
            </div>
          )}
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {proposalNumber && (
          <Fact label="Proposal no." mono>
            {proposalNumber}
          </Fact>
        )}
        {proposalStatus && <Fact label="Proposal status">{proposalStatus}</Fact>}
        {idv !== null && <Fact label="IDV">{formatCurrencyPreserve(idv)}</Fact>}
        {odPremium !== null && <Fact label="OD premium">{formatCurrencyPreserve(odPremium)}</Fact>}
        {tpPremium !== null && <Fact label="TP premium">{formatCurrencyPreserve(tpPremium)}</Fact>}
        {validTill && <Fact label="Valid till">{formatDate(validTill)}</Fact>}
      </dl>

      <EarningStrip earning={earning} />
    </section>
  );
}

export default SelectedOfferPanel;
