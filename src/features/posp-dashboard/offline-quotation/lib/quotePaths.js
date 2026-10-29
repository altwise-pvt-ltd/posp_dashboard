// Page addresses inside the offline-quotation module.
export const QUOTE_CREATE_PATH = '/offline-quotation/create';
export const QUOTE_LIST_PATH = '/offline-quotation/view';

/** The detail page for one quote. Takes the uuid, never the quote number. */
export const quoteDetailPath = (quoteId) => `${QUOTE_LIST_PATH}/${encodeURIComponent(quoteId)}`;
