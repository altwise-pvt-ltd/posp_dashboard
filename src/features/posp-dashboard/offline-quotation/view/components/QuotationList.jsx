import QuotationCard from './QuotationCard';
import QuotationTable from './QuotationTable';

/**
 * Renders both layouts and hides one with a utility: cards below `md`, the table
 * from `md` up. Each row's text is in the DOM twice.
 */
function QuotationList({ quotations }) {
  return (
    <>
      <div className="flex flex-col gap-2.5 md:hidden">
        {quotations.map((quotation) => (
          <QuotationCard key={quotation.id ?? quotation.quoteNumber} quotation={quotation} />
        ))}
      </div>

      <div className="hidden md:block">
        <QuotationTable quotations={quotations} />
      </div>
    </>
  );
}

export default QuotationList;
