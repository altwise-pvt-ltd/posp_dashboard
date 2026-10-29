import { formatCurrencyPreserve, formatDate } from '@/shared/lib/format';
import { showAlert } from '@/shared/store/alertStore';
import { copyText } from './clipboard';
import { formatProduct, hasDate } from './quotationFormat';

// Plain-text summary of a paid quote, for sharing.
export const quoteShareText = (quote, payment) =>
  [
    quote.quoteNumber && `Quotation ${quote.quoteNumber}`,
    (quote.lob || quote.product) && formatProduct(quote),
    quote.selectedOffer?.insurerName && `Insurer: ${quote.selectedOffer.insurerName}`,
    Number.isFinite(payment.amount) && `Premium paid: ${formatCurrencyPreserve(payment.amount)}`,
    hasDate(payment.paidAt) && `Paid on: ${formatDate(payment.paidAt)}`,
  ]
    .filter(Boolean)
    .join('\n');

// Uses native share if available, else copies the summary and reports it in an alert.
export async function shareQuote(quote, payment) {
  const text = quoteShareText(quote, payment);

  if (navigator.share) {
    try {
      await navigator.share({ title: quote.quoteNumber || 'Quotation', text });
      return;
    } catch (err) {
      // Dismissing the sheet is not a failure.
      if (err?.name === 'AbortError') return;
    }
  }

  const copied = await copyText(text);
  showAlert(
    copied
      ? { variant: 'success', title: 'Copied', message: 'Quote summary copied to the clipboard.' }
      : { variant: 'error', title: "Couldn't share", message: 'Your browser blocked the clipboard.' }
  );
}
