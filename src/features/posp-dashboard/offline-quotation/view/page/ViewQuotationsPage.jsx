import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSearch, FileText, Loader2, Plus, RefreshCw, TriangleAlert } from 'lucide-react';
import DashboardLayout from '@/shared/layouts/DashboardLayout';
import CustomButton from '@/shared/components/CustomButton';
import Pagination from '@/shared/components/Pagination';
import QuoteNotice from '@/features/posp-dashboard/offline-quotation/components/QuoteNotice';
import { QUOTE_CREATE_PATH } from '@/features/posp-dashboard/offline-quotation/lib/quotePaths';
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
    paging,
    page,
    pageCount,
    setPage,
    rangeStart,
    rangeEnd,
    error,
    retry,
    clearFilters,
  } = useQuotationList();

  const goCreate = () => navigate(QUOTE_CREATE_PATH);

  // An error with no rows to fall back on.
  const blocked = Boolean(error) && rows.length === 0;

  const showFilters = rows.length > 0 || status !== ALL;

  // Scroll back to the top of the list on page change.
  const listRef = useRef(null);
  const changePage = (next) => {
    setPage(next);
    listRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const statusName = statuses.find((entry) => entry.code === status)?.label ?? status;

  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col gap-gutter">
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

        <section
          ref={listRef}
          className="anim-fade-d1 scroll-mt-4 rounded-xl border border-hairline bg-white p-4 sm:p-gutter"
        >
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
                  disabled={paging}
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
                    pageCount > 1
                      ? 'No quotation on this page matches what you typed — try another page.'
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
                <div
                  aria-busy={paging}
                  className={`transition-opacity ${paging ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <QuotationList quotations={visible} />
                </div>
              )}

              {query && pageCount > 1 && (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Search only looks at the quotations on this page.
                </p>
              )}

              {error && rows.length > 0 && (
                <p className="font-body-md text-body-md text-error flex items-start gap-2">
                  <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {error?.message || 'Couldn’t load that page. Please try again.'}
                </p>
              )}

              {rows.length > 0 && (
                <Pagination
                  label="Quotation pages"
                  page={page}
                  pageCount={pageCount}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  total={totalCount}
                  onPageChange={changePage}
                  disabled={paging}
                />
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default ViewQuotationsPage;
