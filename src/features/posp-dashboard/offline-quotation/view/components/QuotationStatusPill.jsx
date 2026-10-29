import { recallStatusColor, statusLabel, statusStyle } from '../lib/quotationStatus';

// Label and colour come from the row; with no colorHex (the detail reply has none),
// falls back to the colour the queue last gave this status.
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
