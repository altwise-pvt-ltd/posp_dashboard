import QuotationCard from './QuotationCard';
import QuotationTable from './QuotationTable';

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
