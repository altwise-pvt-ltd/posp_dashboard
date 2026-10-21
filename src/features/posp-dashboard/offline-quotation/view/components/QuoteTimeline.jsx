import { formatDateTime, hasDate } from '../lib/quotationFormat';
import { PANEL, PANEL_TITLE } from '../lib/panel';

/** Milestones derived from dates the quote and its payment already carry. */
function buildEvents(quote, payment) {
  return [
    { key: 'raised', label: 'Quote raised', at: quote?.createdAt },
    { key: 'selected', label: 'Policy selected', at: quote?.selectedOffer?.acceptedAt },
    { key: 'paid', label: 'Payment made', at: payment?.paidAt },
    { key: 'received', label: 'Payment received', at: payment?.receivedAt },
  ]
    .filter((event) => hasDate(event.at))
    .sort((a, b) => new Date(a.at) - new Date(b.at));
}

/** Shown only when there are at least two events to put in order. */
function QuoteTimeline({ quote, payment }) {
  const events = buildEvents(quote, payment);
  if (events.length < 2) return null;

  return (
    <section className={PANEL}>
      <h3 className={PANEL_TITLE}>Activity</h3>

      <ol className="mt-4">
        {events.map((event, index) => (
          <li key={event.key} className="relative flex gap-3 pb-4 last:pb-0">
            {index < events.length - 1 && (
              <span aria-hidden="true" className="absolute left-1.25 top-4 h-full w-px bg-hairline" />
            )}
            <span
              aria-hidden="true"
              className="relative mt-1.5 size-2.75 shrink-0 rounded-full bg-orange-500 ring-4 ring-orange-50"
            />
            <div className="min-w-0">
              <p className="font-body-lg text-body-lg text-on-surface">{event.label}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{formatDateTime(event.at)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default QuoteTimeline;
