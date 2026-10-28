import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/** The detail page for one quote. Takes the uuid, never the quote number. */
export const quotationPath = (quoteId) => `/offline-quotation/view/${encodeURIComponent(quoteId)}`;

const ROW_CLASS =
  'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/40';

/**
 * Props that make a whole row open its quote on click or Enter. Ctrl/Cmd-click
 * opens it in a new tab. A row without an id gets no props and stays inert.
 */
export function useOpenQuotation() {
  const navigate = useNavigate();

  return useCallback(
    (quoteId) => {
      if (!quoteId) return {};

      const path = quotationPath(quoteId);
      const open = (event) => {
        if (event.ctrlKey || event.metaKey) {
          window.open(path, '_blank', 'noopener');
          return;
        }
        navigate(path, { state: { fromList: true } });
      };

      return {
        tabIndex: 0,
        className: ROW_CLASS,
        onClick: (event) => {
          // Releasing a text selection is not a click on the row.
          if (window.getSelection()?.toString()) return;
          open(event);
        },
        onKeyDown: (event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          open(event);
        },
      };
    },
    [navigate]
  );
}
