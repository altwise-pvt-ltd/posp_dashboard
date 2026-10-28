import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileQuestion,
  Loader2,
  Pencil,
  RefreshCw,
  Share2,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import DashboardLayout from "@/shared/layouts/DashboardLayout";
import CustomButton from "@/shared/components/CustomButton";
import { daysUntil, formatCurrencyPreserve, formatDate } from "@/shared/lib/format";
import { showAlert } from "@/shared/store/alertStore";
import QuoteNotice from "../../components/QuoteNotice";
import { paymentStatusMeta } from "../../lib/paymentFormat";
import InsurerResponsePanel from "../components/InsurerResponsePanel";
import MarkPaymentDrawer from "../components/MarkPaymentDrawer";
import PaymentConfirmationPanel from "../components/PaymentConfirmationPanel";
import PaymentInstructionDrawer from "../components/PaymentInstructionDrawer";
import QuotationStatusPill from "../components/QuotationStatusPill";
import SelectedOfferPanel from "../components/SelectedOfferPanel";
import QuoteAnswersAccordion from "../components/QuoteAnswersAccordion";
import QuoteEditForm from "../components/QuoteEditForm";
import QuoteDocumentsPanel from "../components/QuoteDocumentsPanel";
import QuoteTimeline from "../components/QuoteTimeline";
import VerificationDialog from "../components/VerificationDialog";
import Fact from "../components/Fact";
import { useQuoteDetail } from "../hooks/useQuoteDetail";
import { useQuoteResponses } from "../hooks/useQuoteResponses";
import { useQuotePayment } from "../hooks/useQuotePayment";
import { usePaymentInstruction } from "../hooks/usePaymentInstruction";
import { useQuoteDocuments } from "../hooks/useQuoteDocuments";
import { submitPaymentReceipt } from "../api/paymentInstructionApi";
import { copyText } from "../lib/clipboard";
import {
  formatAge,
  formatProduct,
  formatSumInsured,
  hasDate,
  splitLeadSection,
} from "../lib/quotationFormat";
import { canApplyForVerification, canEditQuote } from "../lib/quotationStatus";

/**
 * One quote, opened from the list — `GET /quote/<quoteId>` joined to
 * `GET /quote/metadata` (see `useQuoteDetail`). Sections follow the create
 * wizard's order; only answered questions are rendered.
 */

// A payment in these states doesn't count as paid; the agent may need to pay again.
const UNPAID_STATUSES = new Set(["Failed", "Rejected"]);

/** Plain-text summary of a paid quote, for the Share button. */
const shareText = (quote, payment) =>
  [
    quote.quoteNumber && `Quotation ${quote.quoteNumber}`,
    (quote.lob || quote.product) && formatProduct(quote),
    quote.selectedOffer?.insurerName && `Insurer: ${quote.selectedOffer.insurerName}`,
    Number.isFinite(payment.amount) && `Premium paid: ${formatCurrencyPreserve(payment.amount)}`,
    hasDate(payment.paidAt) && `Paid on: ${formatDate(payment.paidAt)}`,
  ]
    .filter(Boolean)
    .join("\n");

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
  const hasSelection = Boolean(quote?.selectedOffer);
  const insurer = useQuoteResponses(quoteId, quote?.statusCode, hasSelection);

  // The server's id once the quote has loaded, else the route param.
  const id = quote?.id ?? quoteId;

  /** The latest payment on this quote, once an offer has been selected. */
  const payment = useQuotePayment(id, quote?.quoteNumber, hasSelection);
  const paid = Boolean(payment) && !UNPAID_STATUSES.has(paymentStatusMeta(payment.status).label);

  const selectedResponse = insurer.responses.find((response) => response.isSelected);

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

  /** Pops back to the list when we arrived from it, else replaces this entry. */
  const leaveToList = () => {
    if (location.state?.fromList) navigate(-1);
    else navigate("/offline-quotation/view", { replace: true });
  };

  /** Errors are rethrown so the form can show them against its fields. */
  const submitPayment = async (values) => {
    const { message } = await submitPaymentReceipt(id, values);

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
   * `canEditQuote`), and only once the form and the uploaded documents have
   * loaded — the editor is seeded from both.
   */
  const [editing, setEditing] = useState(false);
  const canEdit =
    Boolean(quote && metadata) &&
    !docs.loading &&
    !docs.error &&
    canEditQuote(quote.statusCode);

  /** Saved: re-read the quote so the page shows what the server now holds. */
  const finishEditing = useCallback(() => {
    setEditing(false);
    refresh();
    refreshDocs();
  }, [refresh, refreshDocs]);

  /**
   * `useQuoteResponses.select` re-reads the comparison but not the quote, and
   * accepting moves the status — so refresh the detail too. A quiet refresh,
   * not `retry`: the page stays readable while it re-reads.
   */
  const acceptResponse = async (responseId) => {
    const accepted = await insurer.select(responseId);
    if (accepted) refresh();
  };

  /** Offered unless the quote is already at or past verification. */
  const canApply = Boolean(quote) && canApplyForVerification(quote.statusCode);

  const confirm = async () => {
    const sent = await submitForVerification();

    // Closed either way; the alert store reports both outcomes.
    setConfirming(false);

    // The list route unmounts behind us, so arriving there mounts
    // `useQuotationList` fresh and fetches page 1.
    if (sent) navigate("/offline-quotation/view");
  };

  /** Native share sheet where there is one, else copy the summary. */
  const share = async () => {
    const text = shareText(quote, payment);

    if (navigator.share) {
      try {
        await navigator.share({ title: quote.quoteNumber || "Quotation", text });
        return;
      } catch (err) {
        // Dismissing the sheet is not a failure.
        if (err?.name === "AbortError") return;
      }
    }

    const copied = await copyText(text);
    showAlert(
      copied
        ? { variant: "success", title: "Copied", message: "Quote summary copied to the clipboard." }
        : { variant: "error", title: "Couldn't share", message: "Your browser blocked the clipboard." },
    );
  };

  /**
   * The queue computes `ageDays` for us; this reply doesn't send it, so it is
   * worked out from `createdAt` with the shared helper — which floors both ends
   * to local midnight, so the answer doesn't change with the time of day.
   */
  const age = formatAge(quote ? -(daysUntil(quote.createdAt) ?? 0) : null);

  // The first answer section is shown inside the summary card; the rest become panels.
  const { leadEntries, panelSections } = splitLeadSection(answers, quote);

  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col gap-gutter">
        {/* Goes to the list, not back — a quote opened from a shared URL has no history. */}
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
              /* Navigates on click; not a <Link>, which would nest <a> and <button>. */
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
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline-soft pb-4">
                <div className="min-w-0">
                  <h1 className="font-data-mono text-headline-lg font-semibold text-on-surface">
                    {quote.quoteNumber || "Quotation"}
                  </h1>
                  {(quote.lob || quote.product) && (
                    <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
                      {formatProduct(quote)}
                    </p>
                  )}
                </div>

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

                    {paymentInstruction && !paid && (
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

                    {paid && (
                      <CustomButton
                        variant="secondary"
                        size="md"
                        leftIcon={<Share2 />}
                        onClick={share}
                      >
                        Share
                      </CustomButton>
                    )}
                  </div>
                </div>
              </header>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
                {Number.isFinite(quote.sumInsured) && (
                  <Fact label="Sum insured">
                    {formatSumInsured(quote.sumInsured)}
                  </Fact>
                )}
                {paid && Number.isFinite(payment.amount) ? (
                  <Fact label="Premium paid">
                    {formatCurrencyPreserve(payment.amount)}
                  </Fact>
                ) : (
                  Number.isFinite(quote.expectedPremium) && (
                    <Fact label="Expected premium">
                      {formatSumInsured(quote.expectedPremium)}
                    </Fact>
                  )
                )}
                {quote.fileType && (
                  <Fact label="Case type">{quote.fileType}</Fact>
                )}
                {leadEntries.map((entry) => (
                  <Fact key={entry.code} label={entry.label}>
                    {entry.text}
                  </Fact>
                ))}

                {/* Once paid, these dates move to the activity timeline. */}
                {!paid && hasDate(quote.createdAt) && (
                  <Fact label="Raised">
                    {formatDate(quote.createdAt)}
                    {age && (
                      <span className="font-body-md text-body-md text-on-surface-variant">
                        {" · "}
                        {age}
                      </span>
                    )}
                  </Fact>
                )}
                {!paid && hasDate(quote.updatedAt) && (
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
                quote={{ ...quote, id }}
                metadata={metadata}
                documents={docs.documents}
                onCancel={() => setEditing(false)}
                onSaved={finishEditing}
              />
            ) : (
              <>
                {payment && <PaymentConfirmationPanel payment={payment} />}

                {quote.selectedOffer && (
                  <SelectedOfferPanel
                    offer={quote.selectedOffer}
                    earning={selectedResponse?.earning}
                  />
                )}

                {/* Once an offer is selected, only that one is shown. */}
                {!hasSelection && insurer.expected && (
                  <InsurerResponsePanel
                    quoteId={id}
                    responses={insurer.responses}
                    loading={insurer.loading}
                    error={insurer.error}
                    onRetry={insurer.retry}
                    onSelect={acceptResponse}
                    selectingId={insurer.selectingId}
                  />
                )}

                <QuoteAnswersAccordion
                  sections={panelSections}
                  orphans={answers.orphans}
                  unlabelled={unlabelled}
                  defaultOpen={!hasSelection}
                />

                {/* Hidden once loaded with nothing in it. */}
                {(docs.loading || docs.error || docs.documents.length > 0) && (
                  <QuoteDocumentsPanel
                    quoteId={id}
                    documents={docs.documents}
                    loading={docs.loading}
                    error={docs.error}
                    onRetry={docs.refresh}
                    metadata={metadata}
                  />
                )}

                <QuoteTimeline quote={quote} payment={payment} />
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
