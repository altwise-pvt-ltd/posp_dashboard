import { Loader2, PackageOpen, RefreshCw, TriangleAlert } from 'lucide-react';
import DashboardLayout from '@/shared/layouts/DashboardLayout';
import CustomButton from '@/shared/components/CustomButton';
import { useQuoteCatalog } from '../hooks/useQuoteCatalog';
import QuoteNotice from '../components/QuoteNotice';
import QuoteWizard from '../components/QuoteWizard';

function Panel({ children, className = '' }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-4 sm:p-gutter ${className}`}>
      {children}
    </section>
  );
}

function OfflineQuotationPage() {
  const { catalog, loading, error, retry } = useQuoteCatalog();

  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col gap-gutter">
        <header className="anim-fade">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Offline Quotation</h1>
          <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
            Pick what the quote is for, then fill in the customer's details.
          </p>
        </header>

        <Panel className="anim-fade-d1">
          {loading ? (
            <QuoteNotice
              icon={<Loader2 size={20} className="animate-spin" />}
              title="Loading the catalogue"
              body="Fetching every line of business you can raise a quote under."
            />
          ) : error ? (
            <QuoteNotice
              icon={<TriangleAlert size={20} />}
              title="Couldn't load the catalogue"
              body={error?.message || 'The product list could not be fetched. Please try again.'}
              action={
                <CustomButton
                  variant="primary"
                  size="md"
                  leftIcon={<RefreshCw />}
                  onClick={retry}
                  className="mt-2"
                >
                  Try again
                </CustomButton>
              }
            />
          ) : catalog.length === 0 ? (
            <QuoteNotice
              icon={<PackageOpen size={20} />}
              title="Nothing to quote yet"
              body="No lines of business have been published for your account."
              action={
                <CustomButton
                  variant="secondary"
                  size="md"
                  leftIcon={<RefreshCw />}
                  onClick={retry}
                  className="mt-2"
                >
                  Refresh
                </CustomButton>
              }
            />
          ) : (
            <QuoteWizard catalog={catalog} />
          )}
        </Panel>
      </div>
    </DashboardLayout>
  );
}

export default OfflineQuotationPage;
