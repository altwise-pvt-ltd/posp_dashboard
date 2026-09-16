import { useNavigate } from 'react-router-dom';
import { FileSearch, FileText, Info, Loader2, Plus, RefreshCw, TriangleAlert } from 'lucide-react';
import DashboardLayout from '@/shared/layouts/DashboardLayout';
import CustomButton from '@/shared/components/CustomButton';
import QuoteNotice from '../../components/QuoteNotice';
import QuotationFilters from '../components/QuotationFilters';
import QuotationList from '../components/QuotationList';
import { useQuotationList } from '../hooks/useQuotationList';

/**
 * "View Quotations" — the read side of the offline quotation flow, and the page
 * the sidebar's second child under Offline Quotation has been pointing at.
 *
 * The page owns the states and nothing else: every row, chip and pill below it
 * is a component that takes what it draws as props, and the data itself comes
 * from `useQuotationList`. That split is what lets the whole screen switch from
 * mock rows to a real endpoint by editing one function.
 *
 * Four outcomes, and they are deliberately four rather than two — "the request
 * failed", "you have no quotations", and "nothing matches this filter" are
 * three different things to tell someone, and a single empty state that covers
 * all of them tells them nothing.
 */
function ViewQuotationsPage() {
  const navigate = useNavigate();
  const {
    quotations,
    visible,
    counts,
    query,
    setQuery,
    status,
    setStatus,
    filtered,
    loading,
    error,
    retry,
    clearFilters,
  } = useQuotationList();

  const hasRows = quotations.length > 0;

  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col gap-gutter">
        {/* Title block and the one primary action. The action is here rather
            than inside the panel because it leaves this page — it is the other
            half of the sidebar group, not a control over the list. */}
        <header className="anim-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Quotations</h1>
            <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
              Every quote you've raised, newest first.
            </p>
          </div>

          <CustomButton
            variant="primary"
            size="md"
            leftIcon={<Plus />}
            onClick={() => navigate('/offline-quotation/create')}
          >
            New quotation
          </CustomButton>
        </header>

        {/*
          ⚠ Remove with the mock. Until `useQuotationList` is reading a real
          endpoint, the rows below are invented, and a list of plausible-looking
          quotes with no label on it is the kind of thing that reaches a demo
          and gets believed.
        */}
        <p className="anim-fade-d1 font-body-md text-body-md flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Sample data — the quotations service isn't connected yet, so nothing here is real.
        </p>

        <section className="anim-fade-d2 rounded-xl border border-gray-200 bg-white p-4 sm:p-gutter">
          {loading ? (
            <QuoteNotice
              icon={<Loader2 size={20} className="animate-spin" />}
              title="Loading your quotations"
              body="Fetching every quote raised under your account."
            />
          ) : error ? (
            <QuoteNotice
              icon={<TriangleAlert size={20} />}
              title="Couldn't load your quotations"
              body={error?.message || 'The list could not be fetched. Please try again.'}
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
          ) : !hasRows ? (
            <QuoteNotice
              icon={<FileText size={20} />}
              title="No quotations yet"
              body="Quotes you raise from the create screen will be listed here."
              action={
                <CustomButton
                  variant="primary"
                  size="md"
                  leftIcon={<Plus />}
                  onClick={() => navigate('/offline-quotation/create')}
                  className="mt-2"
                >
                  Create a quotation
                </CustomButton>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              <QuotationFilters
                query={query}
                onQueryChange={setQuery}
                status={status}
                onStatusChange={setStatus}
                counts={counts}
              />

              {filtered ? (
                <QuoteNotice
                  icon={<FileSearch size={20} />}
                  title="Nothing matches"
                  body="No quotation fits the search and status you've picked."
                  action={
                    <CustomButton variant="secondary" size="md" onClick={clearFilters} className="mt-2">
                      Clear filters
                    </CustomButton>
                  }
                />
              ) : (
                <>
                  <QuotationList quotations={visible} />

                  {/* Only once the controls are actually hiding something —
                      "Showing 5 of 5" is noise. */}
                  {visible.length !== quotations.length && (
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Showing {visible.length} of {quotations.length} quotations.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default ViewQuotationsPage;
