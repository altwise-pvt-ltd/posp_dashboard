import { BadgeCheck, Check, Inbox, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import QuoteNotice from '../../components/QuoteNotice';

/**
 * What the insurers answered — `GET /quote/<id>/compare`, rendered.
 *
 * Only ever mounted on a quote whose status says responses exist; that decision
 * is `useQuoteResponses`', not this component's.
 *
 * Two cards across, so a pair of quotes can be read side by side rather than
 * one above the other. Everything on a card is a value the server sent — no
 * verdict of the app's own is printed here, which is why there is no "lowest
 * premium" flag and no note about the order. The figures are set out so they
 * can be compared and the comparing is left to the person doing it.
 *
 * ⚠ There is no insurer *name* on this reply, only `insurerId` as a uuid, and
 * no master list in the app to resolve it against. So a card is identified by
 * the insurer's own quote reference where there is one. This is the panel's
 * biggest weakness and it is a backend gap, not a layout problem.
 */

/** A labelled fact. Rendered only when there is something to put in it. */
function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
        {label}
      </dt>
      <dd className="font-body-lg text-body-lg mt-0.5 break-words text-on-surface">{children}</dd>
    </div>
  );
}

/**
 * The agent's commission on this response — not the customer's money.
 *
 * Set apart from the premium deliberately: they are both rupee figures about
 * the same quote, and mistaking one for the other is the expensive error on
 * this screen. `NO_GRID` is the common case today and carries a note
 * explaining itself, so the note is shown rather than the bare status code —
 * "No rate card is configured for this insurer yet" is an answer, `NO_GRID` is
 * a string only the backend team can read.
 *
 * Pinned to the foot of the card — by `CardFoot` below, not by this component:
 * two `mt-auto` children in one flex column split the slack between them
 * instead of one taking it all, which would open a gap between this strip and
 * the button under it. Two cards side by side hold different numbers of facts —
 * one insurer sends a `validTill` and the other does not — and without the pin
 * the earning strips sit at two different heights, which reads as one card
 * being unfinished rather than as one fact being absent.
 */
function Earning({ earning }) {
  const { points, status, planName, note } = earning;
  if (points === null && !status && !planName && !note) return null;

  return (
    <div className="pt-4">
      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
        <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
          Your earning
          {planName && <span className="normal-case"> · {planName} plan</span>}
        </p>
        <p className="font-body-md text-body-md mt-1 text-on-surface">
          {points !== null ? `${points} points` : note || status || '—'}
        </p>
        {points !== null && note && (
          <p className="font-body-md text-body-md mt-0.5 text-on-surface-variant">{note}</p>
        )}
      </div>
    </div>
  );
}

/**
 * The foot of a card: what the agent earns on this response, and the one
 * decision the screen asks them to make about it.
 *
 * `mt-auto` here rather than on either child, so the whole block is pushed down
 * as a unit and the foots of two side-by-side cards line up even when one
 * insurer sent a `validTill` and the other did not.
 *
 * The button is only ever the *selecting* one. A response already chosen shows
 * that it was, and offers nothing — there is no "unselect" route, and a control
 * that undoes a decision the server has no way to undo is a lie told in a
 * button. Switching to a different insurer is done from that insurer's own
 * card, where the premium being switched to is on screen.
 *
 * ⚠ Whether the server accepts a second, different selection is unconfirmed —
 * see `accept` in `endpoints.js`. So the other cards keep their buttons and a
 * rejection arrives as the server's own message rather than as a control this
 * app hid on a guess.
 */
function CardFoot({ response, onSelect, selecting, busy }) {
  const { responseId, isSelected, earning } = response;

  /* No id to post means no button — see `responseId` in `quoteCompareApi`.
     Nothing else on the card changes: a response that cannot be chosen is
     still a quote worth reading and comparing. */
  const selectable = Boolean(responseId) && Boolean(onSelect);

  return (
    <div className="mt-auto">
      <Earning earning={earning} />

      {isSelected ? (
        <p className="font-body-md text-body-md mt-4 flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2 text-orange-700">
          <Check aria-hidden="true" className="size-4 shrink-0" />
          This is the selected policy for this quotation.
        </p>
      ) : (
        selectable && (
          <CustomButton
            variant="primary"
            size="md"
            fullWidth
            className="mt-4"
            loading={selecting}
            /* Every button on the panel goes quiet while any one of them is
               working — two selections in flight on the same quote is a race
               whose loser is whichever request the server happens to finish
               second. */
            disabled={busy && !selecting}
            onClick={() => onSelect(responseId)}
          >
            {selecting ? 'Selecting' : 'Select this policy'}
          </CustomButton>
        )
      )}
    </div>
  );
}

/** One insurer's answer. */
function ResponseCard({ response, onSelect, selecting, busy }) {
  const {
    premium,
    idv,
    validTill,
    receivedAt,
    insurerQuoteRef,
    insurerId,
    isSelected,
    quoteDocPath,
    extras,
  } = response;

  return (
    <li className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* The premium is labelled rather than left as a bare figure. There
              are two rupee amounts on this card and IDV is the larger of the
              two, so an unlabelled headline number is genuinely ambiguous. */}
          <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
            Premium
          </p>
          <p className="font-headline-lg text-headline-lg mt-0.5 font-semibold text-on-surface">
            {premium !== null ? formatCurrency(premium) : '—'}
          </p>

          {/* No insurer name exists on this reply, so its own reference is the
              nearest thing to one. The uuid is the last resort and is set in
              mono, because it is an identifier to copy into a support ticket
              rather than something to read. */}
          {insurerQuoteRef ? (
            <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
              Insurer ref{' '}
              <span className="font-data-mono text-on-surface">{insurerQuoteRef}</span>
            </p>
          ) : (
            insurerId && (
              <p className="font-data-mono text-body-md mt-1 truncate text-on-surface-variant">
                {insurerId}
              </p>
            )
          )}
        </div>

        {/* `isSelected` is the server's record of a choice already made, not a
            judgement of this app's. It stays. */}
        {isSelected && (
          <span className="font-label-caps text-status-pill inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-orange-700 ring-1 ring-orange-200">
            <BadgeCheck aria-hidden="true" className="size-3.5" />
            Selected
          </span>
        )}
      </div>

      {/* Only the facts this response actually carries. A row rendered as "—"
          states that the insurer answered and said nothing, which is not what a
          null here means.

          Ruled off from the header so the premium reads as the card's subject
          and these as its detail, and held to two columns because the card is
          half the panel's width. */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
        {idv !== null && <Fact label="IDV">{formatCurrency(idv)}</Fact>}
        {validTill && <Fact label="Valid till">{formatDate(validTill)}</Fact>}
        {receivedAt && <Fact label="Received">{formatDate(receivedAt)}</Fact>}

        {/* ⚠ A storage path, not a URL, and nothing in this app serves it yet.
            Shown as text so it is not pretending to be a working download. */}
        {quoteDocPath && (
          <Fact label="Quote document">
            <span className="font-data-mono text-body-md break-all">{quoteDocPath}</span>
          </Fact>
        )}

        {/* Fields the server started sending that the normalizer does not name.
            Generic, but visible — a new field going unnoticed for a release is
            the failure this avoids. */}
        {extras.map((extra) => (
          <Fact key={extra.key} label={extra.label}>
            {typeof extra.value === 'object' ? JSON.stringify(extra.value) : String(extra.value)}
          </Fact>
        ))}
      </dl>

      <CardFoot response={response} onSelect={onSelect} selecting={selecting} busy={busy} />
    </li>
  );
}

function InsurerResponsePanel({
  responses = [],
  loading,
  error,
  onRetry,
  onSelect,
  selectingId,
}) {
  /** True while any card's selection is in flight — see `CardFoot`. */
  const busy = Boolean(selectingId);

  return (
    <section className="anim-fade-d2 rounded-xl border border-gray-200 bg-white p-4 sm:p-gutter">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-headline-md text-headline-md text-on-surface">Insurer responses</h3>
        {/* A count, which is a fact about the list. Nothing about its order:
            that would be the app describing a decision it made rather than
            reporting something the insurers said. */}
        {responses.length > 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant">
            {responses.length} {responses.length === 1 ? 'response' : 'responses'}
          </p>
        )}
      </div>
      <p className="font-body-md text-body-md mt-0.5 text-on-surface-variant">
        What came back from the insurers this quote was sent to.
      </p>

      {loading ? (
        <QuoteNotice
          icon={<Loader2 size={20} className="animate-spin" />}
          title="Loading responses"
          body="Fetching what the insurers have sent back."
        />
      ) : error ? (
        <QuoteNotice
          icon={<TriangleAlert size={20} />}
          title="Couldn't load the responses"
          body={error?.message || 'The responses could not be fetched. Please try again.'}
          action={
            <CustomButton
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw />}
              onClick={onRetry}
              className="mt-2"
            >
              Try again
            </CustomButton>
          }
        />
      ) : responses.length === 0 ? (
        /* The status says a response landed and the list is empty. Said as the
           two facts it is, rather than as "no responses": the quote is in a
           state that has them, so an empty list is more likely a lag between
           the two than a quote nobody answered. */
        <QuoteNotice
          icon={<Inbox size={20} />}
          title="Nothing to show yet"
          body="This quote is marked as having a response, but none has come through to this screen. Try again shortly."
          action={
            <CustomButton
              variant="secondary"
              size="md"
              leftIcon={<RefreshCw />}
              onClick={onRetry}
              className="mt-2"
            >
              Check again
            </CustomButton>
          }
        />
      ) : (
        /* Two across, so a pair of quotes can be read side by side.

           `md` is the same breakpoint — and the same reasoning — as
           `QuotationList`' switch from cards to the table: DashboardLayout's
           sidebar is still off-canvas below `lg`, so from `md` up the content
           column has the whole screen and two cards fit honestly. `sm` was
           wrong, and visibly so: at 640px a card holding a headline figure over
           a four-field grid is squeezed, which is what these cards were doing.

           Grid and not flex: `h-full` on the card then makes every card in a
           row the same height, which is what lets the earning strips line up. */
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {responses.map((response) => (
            <ResponseCard
              key={response.key}
              response={response}
              onSelect={onSelect}
              selecting={Boolean(response.responseId) && response.responseId === selectingId}
              busy={busy}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default InsurerResponsePanel;
