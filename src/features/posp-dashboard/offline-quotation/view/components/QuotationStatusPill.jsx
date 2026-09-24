import { recallStatusColor, statusLabel, statusStyle } from '../lib/quotationStatus';

/**
 * The one place a quote's status becomes something visible.
 *
 * Both the wording and the colour come off the row — `/quote/queue/mine` sends
 * `status: "Draft"` and `colorHex: "#9AA3B2"` — so this component decides
 * nothing about the vocabulary. `statusStyle` only makes the server's colour
 * legible; see the note on INK_LUMINANCE there.
 *
 * The detail reply carries no `colorHex`, so a missing one falls back to what
 * the queue said about that status rather than straight to neutral: the same
 * quote should not wear a coloured pill in the list and a grey one on the page
 * that list opens.
 */
function QuotationStatusPill({ quotation, className = '' }) {
  const color = quotation?.colorHex ?? recallStatusColor(quotation?.statusCode);

  return (
    <span
      style={statusStyle(color)}
      className={`font-label-caps text-status-pill inline-flex items-center rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${className}`}
    >
      {statusLabel(quotation)}
    </span>
  );
}

export default QuotationStatusPill;
