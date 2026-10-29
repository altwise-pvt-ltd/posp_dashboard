import { FileQuestion, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import QuoteNotice from '@/features/posp-dashboard/offline-quotation/components/QuoteNotice';

const SECTION = 'anim-fade-d1 rounded-xl border border-hairline bg-white p-4 sm:p-gutter';

// The detail page's full-page states: "loading", "missing" or "error".
function QuoteDetailNotice({ kind, error, onRetry, onBackToList }) {
  if (kind === 'loading') {
    return (
      <section className={SECTION}>
        <QuoteNotice
          icon={<Loader2 size={20} className="animate-spin" />}
          title="Loading this quotation"
          body="Fetching the latest state of this quote."
        />
      </section>
    );
  }

  if (kind === 'missing') {
    return (
      <section className={SECTION}>
        <QuoteNotice
          icon={<FileQuestion size={20} />}
          title="Quotation not found"
          body="This quote no longer exists, or it was never yours to open."
          action={
            <CustomButton variant="secondary" size="md" onClick={onBackToList} className="mt-2">
              Back to the list
            </CustomButton>
          }
        />
      </section>
    );
  }

  return (
    <section className={SECTION}>
      <QuoteNotice
        icon={<TriangleAlert size={20} />}
        title="Couldn't load this quotation"
        body={error?.message || 'The quote could not be fetched. Please try again.'}
        action={
          <CustomButton
            variant="primary"
            size="md"
            leftIcon={<RefreshCw />}
            onClick={onRetry}
            className="mt-2"
          >
            Try again
          </CustomButton>
        }
      />
    </section>
  );
}

export default QuoteDetailNotice;
