import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { formatCurrencyPreserve } from '@/shared/lib/format';
import { formatValidity } from '../lib/quotationFormat';
import { RESPONSE_COLUMNS, formatExtraValue } from '../lib/insurerResponse';
import { CARD_TRANSITION, CARD_VARIANTS, SELECT_RIPPLE, cardOpacity } from '../lib/responseMotion';
import EarningChip from './EarningChip';
import InsurerLogo from './InsurerLogo';
import ResponseActions from './ResponseActions';

const LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant';
const NOTE = 'block text-xs text-on-surface-variant';
const PILL = 'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold';

// Shown in place of a field the response did not send.
const MISSING = '—';

const VALIDITY_TONE ={ muted: 'text-on-surface-variant', warning: 'font-medium text-warning' };

const rowClasses = ({ selected, expired }) =>
  [
    'relative rounded-xl border p-4 transition-[translate,box-shadow,border-color,background-color] duration-300 md:p-5 motion-reduce:transition-none',
    selected ? 'border-brand bg-brand-tint ring-1 ring-brand' : 'border-hairline bg-white',
    !expired && 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/10 motion-reduce:hover:translate-y-0',
  ]
    .filter(Boolean)
    .join(' ');

function Metric({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className="mt-1 min-w-0 text-ink wrap-anywhere">{children}</dd>
    </div>
  );
}

function InsurerResponseCard({ row, index, dimmed, onView, onSelect, selecting, busy }) {
  const { response, expired, isBest, premiumDelta, lowerIdv } = row;
  const { insurerName, insurerLogoUrl, insurerQuoteRef, premium, idv, validTill, isSelected, earning, extras } =
    response;

  // Set after the entrance animation so later updates skip the stagger.
  const [entered, setEntered] = useState(false);

  const validity = formatValidity(validTill);

  return (
    <motion.li
      layout="position"
      variants={CARD_VARIANTS}
      custom={{ index, entered, opacity: cardOpacity({ expired, dimmed }) }}
      initial="hidden"
      animate="shown"
      transition={CARD_TRANSITION}
      onAnimationComplete={() => setEntered(true)}
      className={rowClasses({ selected: isSelected, expired })}
    >
      {isSelected && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl"
          {...SELECT_RIPPLE}
        />
      )}

      <div className={`flex flex-col gap-4 ${RESPONSE_COLUMNS}`}>
        <div className="flex min-w-0 items-center gap-3">
          <InsurerLogo url={insurerLogoUrl} name={insurerName} />
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <p className="truncate text-[15px] font-semibold text-ink">{insurerName ?? MISSING}</p>
              {isBest && (
                <span className={`${PILL} bg-brand-tint text-brand ring-1 ring-brand/30`}>
                  <Star aria-hidden="true" className="size-3 fill-current" />
                  Best value
                </span>
              )}
              {expired && (
                <span className={`${PILL} bg-well-deep text-ink-subtle ring-1 ring-hairline`}>
                  Expired
                </span>
              )}
            </div>
            <p className="font-data-mono truncate text-xs text-on-surface-variant">
              Ref {insurerQuoteRef ?? MISSING}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 md:col-span-3 md:grid-cols-subgrid">
          <Metric label="Premium">
            <span className="block text-base font-bold tabular-nums md:text-xl">
              {formatCurrencyPreserve(premium)}
            </span>
            {premiumDelta !== null && (
              <span className={`${NOTE} tabular-nums`}>+{formatCurrencyPreserve(premiumDelta)}</span>
            )}
          </Metric>
          <Metric label="IDV">
            <span className="block text-sm tabular-nums md:text-[15px]">{formatCurrencyPreserve(idv)}</span>
            {lowerIdv && <span className={NOTE}>lower IDV</span>}
          </Metric>
          <Metric label="Valid till">
            <span className="block text-sm md:text-[15px]">{validity.date}</span>
            {validity.left && (
              <span className={`block text-xs ${VALIDITY_TONE[validity.tone]}`}>{validity.left}</span>
            )}
          </Metric>
        </dl>
      </div>

      {extras.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
          {extras.map((extra) => (
            <div key={extra.key} className="flex min-w-0 gap-1.5">
              <dt className="text-on-surface-variant">{extra.label}</dt>
              <dd className="break-all text-ink">{formatExtraValue(extra.value)}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-hairline-soft pt-3 md:flex-row md:items-center">
        <EarningChip earning={earning} />
        <ResponseActions
          response={response}
          expired={expired}
          onView={onView}
          onSelect={onSelect}
          selecting={selecting}
          busy={busy}
        />
      </div>
    </motion.li>
  );
}

export default InsurerResponseCard;
