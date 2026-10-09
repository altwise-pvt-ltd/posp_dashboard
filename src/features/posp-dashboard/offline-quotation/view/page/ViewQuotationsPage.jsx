import { useNavigate } from 'react-router-dom';
import { FileSearch, FileText, Loader2, Plus, RefreshCw, TriangleAlert } from 'lucide-react';
import DashboardLayout from '@/shared/layouts/DashboardLayout';
import CustomButton from '@/shared/components/CustomButton';
import QuoteNotice from '../../components/QuoteNotice';
import QuotationFilters from '../components/QuotationFilters';
import QuotationList from '../components/QuotationList';
import { useQuotationList } from '../hooks/useQuotationList';
import { ALL } from '../lib/quotationStatus';


function ViewQuotationsPage() {
  const navigate = useNavigate();
  const {
    rows,
    visible,
    statuses,
    totalCount,
    query,
    setQuery,
    status,
    setStatus,
    filtered,
    loading,
    loadingMore,
    hasNextPage,
    loadMore,
    error,
    retry,
    clearFilters,
  } = useQuotationList();

  const goCreate = () => navigate('/offline-quotation/create');

  /** A failure with nothing on screen behind it — the whole panel is the error. */
  const blocked = Boolean(error) && rows.length === 0;



    
  const showFilters = rows.length > 0 || status !== ALL;

  const hiding = query ? visible.length !== rows.length : rows.length !== totalCount;

  /* The chip's own wording, which is the server's — so the empty state says
     "No sent to insurer quotations", not "No SENT_TO_INSURER quotations". */
  const statusName = statuses.find((entry) => entry.code === status)?.label ?? status;

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
              Every quote you&apos;ve raised, newest first.
            </p>
          </div>

          <CustomButton variant="primary" size="md" leftIcon={<Plus />} onClick={goCreate}>
            New quotation
          </CustomButton>
        </header>

        <section className="anim-fade-d1 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
          {loading ? (
            <QuoteNotice
              icon={<Loader2 size={20} className="animate-spin" />}
              title="Loading your quotations"
              body="Fetching every quote raised under your account."
            />
          ) : blocked ? (
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
          ) : (
            <div className="flex flex-col gap-4">
              {showFilters && (
                <QuotationFilters
                  query={query}
                  onQueryChange={setQuery}
                  status={status}
                  onStatusChange={setStatus}
                  statuses={statuses}
                  disabled={loadingMore}
                />
              )}

              {rows.length === 0 ? (
               
                status === ALL ? (
                  <QuoteNotice
                    icon={<FileText size={20} />}
                    title="No quotations yet"
                    body="Quotes you raise from the create screen will be listed here."
                    action={
                      <CustomButton
                        variant="primary"
                        size="md"
                        leftIcon={<Plus />}
                        onClick={goCreate}
                        className="mt-2"
                      >
                        Create a quotation
                      </CustomButton>
                    }
                  />
                ) : (
                  <QuoteNotice
                    icon={<FileSearch size={20} />}
                    title={`No ${statusName.toLowerCase()} quotations`}
                    body="Nothing in your queue is in that state right now."
                    action={
                      <CustomButton
                        variant="secondary"
                        size="md"
                        onClick={clearFilters}
                        className="mt-2"
                      >
                        Show all
                      </CustomButton>
                    }
                  />
                )
              ) : filtered ? (
                <QuoteNotice
                  icon={<FileSearch size={20} />}
                  title="Nothing matches"
                  body={
                    hasNextPage
                      ? 'No loaded quotation matches what you typed — there are more still to load.'
                      : 'No quotation matches what you typed.'
                  }
                  action={
                    <CustomButton
                      variant="secondary"
                      size="md"
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Clear filters
                    </CustomButton>
                  }
                />
              ) : (
                <QuotationList quotations={visible} />
              )}

              {/* The count, and the way to get more of them. Only rendered once
                  it says something — "Showing 2 of 2" is noise. */}
              {(hiding || hasNextPage) && (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {query
                    ? `Showing ${visible.length} of ${rows.length} loaded.`
                    : `Showing ${rows.length} of ${totalCount}.`}
                  {query && hasNextPage && ' Search only looks at what has been loaded.'}
                </p>
              )}

              {/* A "load more" that failed keeps the rows already on screen and
                  puts the failure next to the button that caused it, rather
                  than replacing a working list with an error panel. */}
              {error && rows.length > 0 && (
                <p className="font-body-md text-body-md text-error flex items-start gap-2">
                  <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {error?.message || 'Couldn’t load any more quotations.'}
                </p>
              )}

              {hasNextPage && (
                <CustomButton
                  variant="secondary"
                  size="md"
                  onClick={loadMore}
                  loading={loadingMore}
                  className="self-center"
                >
                  {loadingMore ? 'Loading' : 'Load more'}
                </CustomButton>
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default ViewQuotationsPage;
