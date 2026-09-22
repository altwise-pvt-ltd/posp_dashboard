import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSearch, Info, Loader2, Plus, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import DashboardLayout from '@/shared/layouts/DashboardLayout';
import CustomButton from '@/shared/components/CustomButton';
import BusinessNotice from '../components/BusinessNotice';
import PolicySummary from '../components/PolicySummary';
import PolicyTrend from '../components/PolicyTrend';
import PolicyFilters from '../components/PolicyFilters';
import PolicyList from '../components/PolicyList';
import PolicyPagination from '../components/PolicyPagination';
import PolicyDetail from '../components/PolicyDetail';
import { usePolicyList } from '../hooks/usePolicyList';

/**
 * "My Business" — the POSP's book of policies, and the page the sidebar's
 * Policies item used to point at before it had one.
 *
 * The page owns the states and nothing else: every row, chip, tile and pill
 * below it is a component that takes what it draws as props, and the data
 * comes from `usePolicyList`. That split is what lets the whole screen switch
 * from mock rows to a real endpoint by editing one function.
 *
 * Four outcomes, and they are deliberately four rather than two — "the request
 * failed", "you have sold nothing yet", and "nothing matches this filter" are
 * three different things to tell someone, and a single empty state that covers
 * all of them tells them nothing.
 *
 * The summary strip sits outside the panel and above the toolbar, so it
 * describes the whole book rather than the current filter. Moving it inside
 * would put it next to chips that *do* respond to filtering and imply it does
 * too.
 */
function BusinessPage() {
  const navigate = useNavigate();
  const {
    policies,
    paged,
    page,
    pageCount,
    setPage,
    rangeStart,
    rangeEnd,
    total,
    counts,
    summary,
    trend,
    query,
    setQuery,
    status,
    setStatus,
    sort,
    setSort,
    now,
    filtered,
    loading,
    error,
    retry,
    clearFilters,
  } = usePolicyList();

  // Which row's drawer is open. The whole policy object, not an id — the list
  // already has the record, and holding the id would mean looking it up again
  // on every render of a panel whose contents cannot change while it is open.
  const [selected, setSelected] = useState(null);

  const hasRows = policies.length > 0;

  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col gap-gutter">
        <header className="anim-fade flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">My Business</h1>
            <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
              Every policy issued under your code.
            </p>
          </div>

          {/* The action leaves this page — it is where new business starts,
              not a control over the list, so it sits in the header. */}
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
          ⚠ Remove with the mock. Until `usePolicyList` is reading a real
          endpoint, the rows below are invented, and a book of plausible-looking
          policies with no label on it is the kind of thing that reaches a demo
          and gets believed.
        */}
        <p className="anim-fade-d1 font-body-md text-body-md flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Sample data — the policy service isn't connected yet, so nothing here is real.
        </p>

        {/* Only drawn when there is a book to summarise: three tiles reading
            ₹0, ₹0, 0 above an empty state is noise in front of the one message
            that screen exists to deliver. The chart is held to the same rule.

            Both sit outside the panel below, and above the toolbar, because
            they describe the whole book rather than the current filter —
            putting them inside, next to chips that do respond to filtering,
            would imply they respond too. */}
        {!loading && !error && hasRows && (
          <>
            <div className="anim-fade-d2">
              <PolicySummary summary={summary} />
            </div>

            <div className="anim-fade-d2">
              <PolicyTrend trend={trend} />
            </div>
          </>
        )}

        <section className="anim-fade-d3 rounded-xl border border-gray-200 bg-white p-4 sm:p-gutter">
          {loading ? (
            <BusinessNotice
              icon={<Loader2 size={20} className="animate-spin" />}
              title="Loading your business"
              body="Fetching every policy issued under your code."
            />
          ) : error ? (
            <BusinessNotice
              icon={<TriangleAlert size={20} />}
              title="Couldn't load your policies"
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
            <BusinessNotice
              icon={<ShieldCheck size={20} />}
              title="No policies yet"
              body="Policies issued from the quotations you raise will be listed here."
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
              <PolicyFilters
                query={query}
                onQueryChange={setQuery}
                status={status}
                onStatusChange={setStatus}
                counts={counts}
                sort={sort}
                onSortChange={setSort}
              />

              {filtered ? (
                <BusinessNotice
                  icon={<FileSearch size={20} />}
                  title="No policies match"
                  body="Nothing in your book fits the search and filter you've set."
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
                <>
                  <PolicyList policies={paged} now={now} onSelect={setSelected} />

                  {/* Inside the filtered branch, so it is never drawn over an
                      empty state — and it reports the filtered count, which is
                      the list the reader is actually paging through. */}
                  <PolicyPagination
                    page={page}
                    pageCount={pageCount}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    total={total}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <PolicyDetail policy={selected} now={now} onClose={() => setSelected(null)} />
    </DashboardLayout>
  );
}

export default BusinessPage;
