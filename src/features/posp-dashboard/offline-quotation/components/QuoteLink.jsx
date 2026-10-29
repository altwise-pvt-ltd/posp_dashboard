import { Link } from 'react-router-dom';
import { quoteDetailPath } from '@/features/posp-dashboard/offline-quotation/lib/quotePaths';

const LINK_CLASS =
  'rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40';

// Links to the quote's detail page; plain text when there is no id.
function QuoteLink({ quoteId, className = '', children }) {
  if (!quoteId) return <span className={className}>{children}</span>;

  return (
    <Link
      to={quoteDetailPath(quoteId)}
      state={{ fromList: true }}
      className={`${LINK_CLASS} ${className}`}
    >
      {children}
    </Link>
  );
}

export default QuoteLink;
