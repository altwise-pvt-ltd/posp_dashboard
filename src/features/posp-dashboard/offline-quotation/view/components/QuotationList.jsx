import QuotationCard from './QuotationCard';
import QuotationTable from './QuotationTable';

/**
 * Picks the layout for the viewport: cards below `md`, the table from `md` up.
 *
 * Both are rendered and one is hidden with a utility, rather than switching on
 * a matchMedia hook. The breakpoint then lives in the same place as every other
 * one in the app, resizing the window never hits a frame with neither layout
 * mounted, and there is no client-only branch to get wrong.
 *
 * The cost is that each row's text is in the DOM twice. At a page of quotes
 * that is nothing; if this ever paginates into the hundreds, revisit it.
 *
 * `md` and not `lg` because the table is the better answer the moment it fits:
 * DashboardLayout's sidebar is still off-canvas at this width, so the content
 * column has the full screen to work with.
 */
function QuotationList({ quotations }) {
  return (
    <>
      <div className="flex flex-col gap-2.5 md:hidden">
        {quotations.map((quotation) => (
          <QuotationCard key={quotation.quoteId} quotation={quotation} />
        ))}
      </div>

      <div className="hidden md:block">
        <QuotationTable quotations={quotations} />
      </div>
    </>
  );
}

export default QuotationList;
