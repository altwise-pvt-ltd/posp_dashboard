import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/shared/layouts/DashboardLayout";
import { paymentStatusMeta } from "@/features/posp-dashboard/offline-quotation/lib/paymentFormat";
import { QUOTE_LIST_PATH } from "@/features/posp-dashboard/offline-quotation/lib/quotePaths";
import InsurerResponsePanel from "../components/InsurerResponsePanel";
import MarkPaymentDrawer from "../components/MarkPaymentDrawer";
import PaymentConfirmationPanel from "../components/PaymentConfirmationPanel";
import PaymentInstructionDrawer from "../components/PaymentInstructionDrawer";
import QuoteDetailHeader from "../components/QuoteDetailHeader";
import QuoteDetailNotice from "../components/QuoteDetailNotice";
import SelectedOfferPanel from "../components/SelectedOfferPanel";
import QuoteAnswersAccordion from "../components/QuoteAnswersAccordion";
import QuoteEditForm from "../components/QuoteEditForm";
import QuoteDocumentsPanel from "../components/QuoteDocumentsPanel";
import QuoteTimeline from "../components/QuoteTimeline";
import VerificationDialog from "../components/VerificationDialog";
import { useQuoteDetail } from "../hooks/useQuoteDetail";
import { useQuoteResponses } from "../hooks/useQuoteResponses";
import { useQuotePayment } from "../hooks/useQuotePayment";
import { usePaymentInstruction } from "../hooks/usePaymentInstruction";
import { usePaymentReceipt } from "../hooks/usePaymentReceipt";
import { useQuoteDocuments } from "../hooks/useQuoteDocuments";
import { shareQuote } from "../lib/quoteShare";
import { splitLeadSection } from "../lib/quotationFormat";
import { canApplyForVerification, canEditQuote } from "../lib/quotationStatus";

// A payment in these states doesn't count as paid; the agent may need to pay again.
const UNPAID_STATUSES = new Set(["Failed", "Rejected"]);

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

  const hasSelection = Boolean(quote?.selectedOffer);
  const insurer = useQuoteResponses(quoteId, quote?.statusCode, hasSelection);

  // The server's id once the quote has loaded, else the route param.
  const id = quote?.id ?? quoteId;

  // Latest payment, once an offer is selected.
  const payment = useQuotePayment(id, quote?.quoteNumber, hasSelection);
  const paid = Boolean(payment) && !UNPAID_STATUSES.has(paymentStatusMeta(payment.status).label);

  const selectedResponse = insurer.responses.find((response) => response.isSelected);

  const [confirming, setConfirming] = useState(false);

  const docs = useQuoteDocuments(quoteId);
  const refreshDocs = docs.refresh;

  // Null until the RM publishes one.
  const { instruction: paymentInstruction } = usePaymentInstruction(quoteId, quote?.statusCode);
  // "instruction", "mark", or null.
  const [paymentView, setPaymentView] = useState(null);
  const closePayment = useCallback(() => setPaymentView(null), []);
  const backToInstruction = useCallback(() => setPaymentView("instruction"), []);

  // Go back if we came from the list, else replace this entry with the list.
  const fromList = Boolean(location.state?.fromList);
  const leaveToList = useCallback(() => {
    if (fromList) navigate(-1);
    else navigate(QUOTE_LIST_PATH, { replace: true });
  }, [fromList, navigate]);

  const submitPayment = usePaymentReceipt(id, leaveToList);

  // Editable states only, once metadata and documents have loaded (the editor needs both).
  const [editing, setEditing] = useState(false);
  const canEdit =
    Boolean(quote && metadata) &&
    !docs.loading &&
    !docs.error &&
    canEditQuote(quote.statusCode);

  // After saving, refetch the quote and its documents.
  const finishEditing = useCallback(() => {
    setEditing(false);
    refresh();
    refreshDocs();
  }, [refresh, refreshDocs]);

  // Accepting changes the quote's status, so refresh the quote as well.
  const acceptResponse = async (responseId) => {
    const accepted = await insurer.select(responseId);
    if (accepted) refresh();
  };

  const canApply = Boolean(quote) && canApplyForVerification(quote.statusCode);

  const confirm = async () => {
    const sent = await submitForVerification();

    // Close either way; the alert reports the outcome.
    setConfirming(false);

    if (sent) navigate(QUOTE_LIST_PATH);
  };

  const notice = loading ? "loading" : missing ? "missing" : error ? "error" : null;

  const { leadEntries, panelSections } = splitLeadSection(answers, quote);

  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col gap-gutter">
        <Link
          to={QUOTE_LIST_PATH}
          className="font-body-md text-body-md anim-fade inline-flex w-fit items-center gap-1.5 rounded-lg text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All quotations
        </Link>

        {notice ? (
          <QuoteDetailNotice
            kind={notice}
            error={error}
            onRetry={retry}
            onBackToList={() => navigate(QUOTE_LIST_PATH)}
          />
        ) : (
          <>
            <QuoteDetailHeader
              quote={quote}
              payment={payment}
              paid={paid}
              leadEntries={leadEntries}
              onEdit={canEdit && !editing ? () => setEditing(true) : null}
              onViewPayment={
                paymentInstruction && !paid ? () => setPaymentView("instruction") : null
              }
              onApply={canApply && !editing ? () => setConfirming(true) : null}
              onShare={paid ? () => shareQuote(quote, payment) : null}
            />

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
