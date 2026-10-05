import { FileSearch, Loader2, RefreshCw, Search, TriangleAlert, Wallet, X } from 'lucide-react';
import DashboardLayout from '@/shared/layouts/DashboardLayout';
import CustomButton from '@/shared/components/CustomButton';
import QuoteNotice from '../../components/QuoteNotice';
import PaymentList from '../components/PaymentList';
import { usePaymentHistory } from '../hooks/usePaymentHistory';

/**
 * "Payment history" — every premium payment recorded against the agent's
 * quotes, from `GET /quote/payments/my`. Each row opens its quote.
 */
function PaymentHistoryPage() {
  const { payments, visible, query, setQuery, filtered, loading, error, retry } =
    usePaymentHistory();

  return (
    <DashboardLayout>
      <div className="dashboard-scale flex flex-col gap-gutter">
        <header className="anim-fade">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Payment history</h1>
          <p className="font-body-md text-body-md mt-1 text-on-surface-variant">
            Premium payments made against your quotes, newest first.
          </p>
        </header>

        <section className="anim-fade-d1 rounded-xl border border-hairline bg-white p-4 sm:p-gutter">
          {loading ? (
            <QuoteNotice
              icon={<Loader2 size={20} className="animate-spin" />}
              title="Loading your payments"
              body="Fetching every payment recorded against your quotes."
            />
          ) : error ? (
            <QuoteNotice
              icon={<TriangleAlert size={20} />}
              title="Couldn't load your payments"
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
          ) : payments.length === 0 ? (
            <QuoteNotice
              icon={<Wallet size={20} />}
              title="No payments yet"
              body="Once a payment is recorded against one of your quotes, it will be listed here."
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div role="search" className="sm:max-w-sm">
                <label htmlFor="payment-search" className="sr-only">
                  Search payments
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-hairline-cool bg-white px-3 py-2 transition-all duration-300 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-focus/20">
                  <Search aria-hidden="true" className="size-4 shrink-0 text-ink-faint" />
                  <input
                    id="payment-search"
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Quote, proposal or UTR number"
                    className="w-full bg-transparent text-sm text-ink placeholder-slate-400 outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="shrink-0 rounded-md p-0.5 text-ink-faint transition-colors hover:bg-well-deep hover:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {filtered ? (
                <QuoteNotice
                  icon={<FileSearch size={20} />}
                  title="Nothing matches"
                  body="No payment matches what you typed."
                  action={
                    <CustomButton
                      variant="secondary"
                      size="md"
                      onClick={() => setQuery('')}
                      className="mt-2"
                    >
                      Clear search
                    </CustomButton>
                  }
                />
              ) : (
                <PaymentList payments={visible} />
              )}

              {query && !filtered && (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Showing {visible.length} of {payments.length}.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default PaymentHistoryPage;
