import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileQuestion,
  Info,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import DashboardLayout from "@/shared/layouts/DashboardLayout";
import CustomButton from "@/shared/components/CustomButton";
import { daysUntil } from "@/shared/lib/format";
import { showAlert } from "@/shared/store/alertStore";
import QuoteNotice from "../../components/QuoteNotice";
import InsurerResponsePanel from "../components/InsurerResponsePanel";
import MarkPaymentDrawer from "../components/MarkPaymentDrawer";
import PaymentInstructionDrawer from "../components/PaymentInstructionDrawer";
import QuotationStatusPill from "../components/QuotationStatusPill";
import SelectedOfferPanel from "../components/SelectedOfferPanel";
import QuoteEditForm from "../components/QuoteEditForm";
import QuoteDocumentsPanel from "../components/QuoteDocumentsPanel";
import VerificationDialog from "../components/VerificationDialog";
import { useQuoteDetail } from "../hooks/useQuoteDetail";
import { useQuoteResponses } from "../hooks/useQuoteResponses";
import { usePaymentInstruction } from "../hooks/usePaymentInstruction";
import { useQuoteDocuments } from "../hooks/useQuoteDocuments";
import { submitPaymentReceipt } from "../api/paymentInstructionApi";
import {
  formatAge,
  formatDate,
  formatProduct,
  formatSumInsured,
} from "../lib/quotationFormat";
import { canApplyForVerification, canEditQuote } from "../lib/quotationStatus";

/**
 * One quote, opened from the list — `GET /quote/<quoteId>` joined to
 * `GET /quote/metadata` (see `useQuoteDetail`).
 *
 * It reads top to bottom as the quote itself: what it is and where it stands,
 * then the form as the agent filled it in, section by section in the order they
 * were asked. The same headings, the same labels, the same sequence as the
 * create wizard — a quote read back should look like the quote that was given.
 *
 * Only answered questions are rendered. A read-back of a 30-question motor form
 * where a third of the rows say "—" is a page about its own blanks; the count
 * of them goes at the bottom instead, where it is available without being in
 * the way.
 */

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
        {label}
      </dt>
      <dd className="font-body-lg text-body-lg mt-0.5 break-words text-on-surface">
        {children}
      </dd>
    </div>
  );
}

/** A panel of answers — one section of the form, or the leftovers. */
function AnswerPanel({ title, caption, entries }) {
  return (
    <section className="anim-fade-d2 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
      <h3 className="font-headline-md text-headline-md text-on-surface">
        {title}
      </h3>
      {caption && (
        <p className="font-body-md text-body-md mt-0.5 text-on-surface-variant">
          {caption}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {entries.map((entry) => (
          <Fact key={entry.code} label={entry.label}>
            {entry.text}
          </Fact>
        ))}
      </dl>
    </section>
  );
}

function QuotationDetailPage() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    quote,
    metadata,
    answers,
    unlabelled,
    loading,
    error,
    missing,
    retry,
    refresh,
    submitForVerification,
    submitting,
  } = useQuoteDetail(quoteId);

  /**
   * The insurers' answers, on a quote in a state that has them. Gated on the
   * status inside the hook, so this is a no-op on every other quote — see
   * `hasInsurerResponses`.
   */
  const insurer = useQuoteResponses(quoteId, quote?.statusCode);

  const [confirming, setConfirming] = useState(false);

  /** Files uploaded on this quote — `GET /quote/<quoteId>/documents`. */
  const docs = useQuoteDocuments(quoteId);
  const refreshDocs = docs.refresh;

  /** The RM's payment instruction; null until one is published. */
  const { instruction: paymentInstruction } = usePaymentInstruction(quoteId, quote?.statusCode);
  /** Which payment drawer is open: "instruction", "mark", or null. */
  const [paymentView, setPaymentView] = useState(null);
  const closePayment = useCallback(() => setPaymentView(null), []);
  const backToInstruction = useCallback(() => setPaymentView("instruction"), []);

  /**
   * Back to the list after a receipt is accepted, without leaving this page
   * behind in history: pop it when we came from the list, else replace it.
   */
  const leaveToList = () => {
    if (location.state?.fromList) navigate(-1);
    else navigate("/offline-quotation/view", { replace: true });
  };

  /** Errors are rethrown so the form can show them against its fields. */
  const submitPayment = async (values) => {
    const { message } = await submitPaymentReceipt(quote?.id ?? quoteId, values);

    showAlert({
      variant: "success",
      title: "Payment submitted",
      message: message || "Your RM will verify the payment receipt.",
    });

    leaveToList();
    return true;
  };

  /**
   * Editing a draft or a returned quote. Offered only in those states (see
   * `canEditQuote`), and only once the form it was raised on has loaded — the
   * editor renders from that form, so without it there is nothing to edit.
   */
  const [editing, setEditing] = useState(false);
  const canEdit = Boolean(quote && metadata) && canEditQuote(quote.statusCode);

  /** Saved: re-read the quote so the page shows what the server now holds. */
  const finishEditing = useCallback(() => {
    setEditing(false);
    refresh();
    refreshDocs();
  }, [refresh, refreshDocs]);

  /**
   * Accepting a response changes two things, and the hook that posts it can
   * only see one.
   *
   * `useQuoteResponses.select` re-reads the comparison, so the "Selected" badge
   * comes from the server rather than from the click. But accepting a quote is
   * a workflow event: the status moves, and the pill and the buttons in the
   * header above are drawn from `useQuoteDetail`, which knows nothing about the
   * POST. Without this the page would show the new badge under the old status.
   *
   * A quiet refresh, not `retry` — the page stays readable while it re-reads.
   */
  const acceptResponse = async (responseId) => {
    const accepted = await insurer.select(responseId);
    if (accepted) refresh();
  };

  /**
   * Offered unless the quote is already at or past verification — a deny-list,
   * for the reason set out on `canApplyForVerification`. After a successful
   * send the status changes and this goes away on its own, because the hook
   * refetches rather than assuming.
   */
  const canApply = Boolean(quote) && canApplyForVerification(quote.statusCode);

  const confirm = async () => {
    const sent = await submitForVerification();

    // Closed either way: the alert store reports both outcomes, and a dialog
    // left open over a success would be a second thing to dismiss.
    setConfirming(false);

    /* Back to the queue on success — the agent opened this quote to send it,
       and once it is sent the list is where the next one is. The list route
       unmounts behind us, so arriving there mounts `useQuotationList` fresh
       and fetches page 1: the quote appears in its new state with nothing to
       invalidate. A failure stays put, where the button still is. */
    if (sent) navigate("/offline-quotation/view");
  };

  /**
   * The queue computes `ageDays` for us; this reply doesn't send it, so it is
   * worked out from `createdAt` with the shared helper — which floors both ends
   * to local midnight, so the answer doesn't change with the time of day.
   */
  const age = formatAge(quote ? -(daysUntil(quote.createdAt) ?? 0) : null);

  // The first answer section (e.g. "Quote Request Info") is shown inside the
  // summary card rather than as its own panel. Its file type repeats the case
  // type already shown there, so that entry is dropped.
  const [leadSection, ...laterSections] = answers?.sections ?? [];
  const mergeLead = leadSection?.rows.length === 1;
  const sameAsCaseType = (entry) =>
    /file\s*type/i.test(entry.label) &&
    String(entry.text).toLowerCase() === String(quote?.fileType ?? "").toLowerCase();
  const leadEntries = mergeLead
    ? leadSection.rows[0].entries.filter((entry) => !sameAsCaseType(entry))
    : [];
  const panelSections = mergeLead ? laterSections : answers?.sections ?? [];

  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col gap-gutter">
        {/* Always a link to the list, never `navigate(-1)` — a quote opened
            from a shared URL has no history to go back through, and a back
            button that does nothing is worse than none. */}
        <Link
          to="/offline-quotation/view"
          className="font-body-md text-body-md anim-fade inline-flex w-fit items-center gap-1.5 rounded-lg text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All quotations
        </Link>

        {loading ? (
          <section className="anim-fade-d1 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
            <QuoteNotice
              icon={<Loader2 size={20} className="animate-spin" />}
              title="Loading this quotation"
              body="Fetching the latest state of this quote."
            />
          </section>
        ) : missing ? (
          <section className="anim-fade-d1 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
            <QuoteNotice
              icon={<FileQuestion size={20} />}
              title="Quotation not found"
              body="This quote no longer exists, or it was never yours to open."
              /* A button that navigates, not a <Link> wrapped around one — an
                 <a> with a <button> inside it is invalid HTML, and the two
                 nested controls are announced as two stops by a screen
                 reader. */
              action={
                <CustomButton
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/offline-quotation/view")}
                  className="mt-2"
                >
                  Back to the list
                </CustomButton>
              }
            />
          </section>
        ) : error ? (
          <section className="anim-fade-d1 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
            <QuoteNotice
              icon={<TriangleAlert size={20} />}
              title="Couldn't load this quotation"
              body={
                error?.message ||
                "The quote could not be fetched. Please try again."
              }
              action={
                <CustomButton
                  variant="primary"
                  size="md"
                  leftIcon={<RefreshCw />}
                  onClick={retry}
                  className="mt-2"
                >
                  Try again
                </CustomButton>
              }
            />
          </section>
        ) : (
          <>
            <section className="anim-fade-d1 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
              {/* The reference is the quote's identity and leads at heading
                  size — there is no customer name to put in that position. */}
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline-soft pb-4">
                <div className="min-w-0">
                  <h1 className="font-data-mono text-headline-lg font-semibold text-on-surface">
                    {quote.quoteNumber ?? "—"}
                  </h1>
                  <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
                    {formatProduct(quote)}
                  </p>
                </div>

                {/* Status and the one action that changes it, stacked — the
                    button is about this quote's state, so it belongs beside
                    the thing that states it. */}
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <QuotationStatusPill quotation={quote} />

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    {canEdit && !editing && (
                      <CustomButton
                        variant="primary"
                        size="md"
                        leftIcon={<Pencil />}
                        onClick={() => setEditing(true)}
                      >
                        Edit
                      </CustomButton>
                    )}

                    {paymentInstruction && (
                      <CustomButton
                        variant="primary"
                        size="md"
                        leftIcon={<Wallet />}
                        onClick={() => setPaymentView("instruction")}
                      >
                        View payment instruction
                      </CustomButton>
                    )}

                    {canApply && !editing && (
                      <CustomButton
                        variant="primary"
                        size="md"
                        leftIcon={<ShieldCheck />}
                        onClick={() => setConfirming(true)}
                      >
                        Submit for verification
                      </CustomButton>
                    )}
                  </div>
                </div>
              </header>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                <Fact label="Sum insured">
                  {formatSumInsured(quote.sumInsured)}
                </Fact>
                <Fact label="Expected premium">
                  {formatSumInsured(quote.expectedPremium)}
                </Fact>
                {quote.fileType && (
                  <Fact label="Case type">{quote.fileType}</Fact>
                )}
                {leadEntries.map((entry) => (
                  <Fact key={entry.code} label={entry.label}>
                    {entry.text}
                  </Fact>
                ))}

                <Fact label="Raised">
                  {formatDate(quote.createdAt)}
                  {age && (
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {" · "}
                      {age}
                    </span>
                  )}
                </Fact>
                {quote.updatedAt && (
                  <Fact label="Last updated">
                    {formatDate(quote.updatedAt)}
                  </Fact>
                )}
                {quote.originatorName && (
                  <Fact label="Raised by">{quote.originatorName}</Fact>
                )}
              </dl>

              {quote.lastRemark && (
                <div className="mt-4 border-t border-hairline-soft pt-4">
                  <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
                    Last remark
                  </p>
                  <p className="font-body-md text-body-md mt-1 rounded-lg bg-well px-3 py-2 text-on-surface">
                    {quote.lastRemark}
                  </p>
                </div>
              )}
            </section>

            {editing ? (
              <QuoteEditForm
                quote={{ ...quote, id: quote.id ?? quoteId }}
                metadata={metadata}
                onCancel={() => setEditing(false)}
                onSaved={finishEditing}
              />
            ) : (
              <>
                {quote.selectedOffer && (
                  <SelectedOfferPanel offer={quote.selectedOffer} />
                )}

                {insurer.expected && (
                  <InsurerResponsePanel
                    responses={insurer.responses}
                    loading={insurer.loading}
                    error={insurer.error}
                    onRetry={insurer.retry}
                    /* The choice is posted, then both the comparison and the
                   quote itself are re-read — the panel holds no selection of
                   its own. See `acceptResponse` above. */
                    onSelect={acceptResponse}
                    selectingId={insurer.selectingId}
                  />
                )}

                {/* The questions couldn't be fetched, so every label below is a
                field code made readable rather than the wording the agent
                actually saw. Said plainly, because the difference is not
                otherwise visible. */}
                {unlabelled && (
                  <p className="anim-fade-d2 font-body-md text-body-md flex items-start gap-2 rounded-xl border border-warning-outline bg-warning-container px-3 py-2 text-on-warning-container">
                    <Info
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    The question list for this product couldn&apos;t be loaded,
                    so the answers below are labelled by field code.
                  </p>
                )}

                {panelSections.map((section) =>
                  section.rows.map((row) => (
                    <AnswerPanel
                      key={`${section.code}-${row.index}`}
                      title={section.name}
                      /* Only when a repeatable section actually repeated — "Entry 1"
                     over a section that has exactly one is a label for a
                     structure the user never made. */
                      caption={
                        section.rows.length > 1
                          ? `Entry ${row.index + 1}`
                          : null
                      }
                      entries={row.entries}
                    />
                  )),
                )}

                {answers.orphans.length > 0 && (
                  <AnswerPanel
                    title="Other answers"
                    caption="Stored on this quote, but no longer part of this product's form."
                    entries={answers.orphans}
                  />
                )}

                {answers.sections.length === 0 &&
                  answers.orphans.length === 0 && (
                    <section className="anim-fade-d2 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
                      <QuoteNotice
                        icon={<FileQuestion size={20} />}
                        title="No answers recorded"
                        body="This quote was created but none of its questions were answered."
                      />
                    </section>
                  )}

                <QuoteDocumentsPanel
                  quoteId={quote.id ?? quoteId}
                  documents={docs.documents}
                  loading={docs.loading}
                  error={docs.error}
                  onRetry={docs.refresh}
                  metadata={metadata}
                />

                {answers.blanks > 0 && (
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {answers.blanks} further{" "}
                    {answers.blanks === 1 ? "question was" : "questions were"}{" "}
                    left blank.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>

      <PaymentInstructionDrawer
        open={paymentView === "instruction"}
        instruction={paymentInstruction}
        reference={quote?.quoteNumber}
        onClose={closePayment}
        onMarkPayment={() => setPaymentView("mark")}
      />

      <MarkPaymentDrawer
        open={paymentView === "mark"}
        amount={paymentInstruction?.amount}
        reference={quote?.quoteNumber}
        onClose={closePayment}
        onBack={backToInstruction}
        onSubmit={submitPayment}
      />

      <VerificationDialog
        open={confirming}
        reference={quote?.quoteNumber}
        submitting={submitting}
        onCancel={() => setConfirming(false)}
        onConfirm={confirm}
      />
    </DashboardLayout>
  );
}

export default QuotationDetailPage;
