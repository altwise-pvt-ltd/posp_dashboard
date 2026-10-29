import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quoteDetailPath } from '@/features/posp-dashboard/offline-quotation/lib/quotePaths';

/**
 * Returns row props that open the quote when the row is clicked; Ctrl/Cmd-click opens a new tab.
 * Keyboard users reach the quote through the row's QuoteLink. No props when there is no id.
 */
export function useOpenQuotation() {
  const navigate = useNavigate();

  return useCallback(
    (quoteId) => {
      if (!quoteId) return {};

      const path = quoteDetailPath(quoteId);

      return {
        className: 'cursor-pointer',
        onClick: (event) => {
          // Links and buttons inside the row handle their own clicks.
          if (event.target.closest('a, button')) return;
          // Releasing a text selection is not a click on the row.
          if (window.getSelection()?.toString()) return;

          if (event.ctrlKey || event.metaKey) {
            window.open(path, '_blank', 'noopener');
            return;
          }
          navigate(path, { state: { fromList: true } });
        },
      };
    },
    [navigate]
  );
}
