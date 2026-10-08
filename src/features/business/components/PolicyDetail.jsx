import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Loader2, RefreshCw, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { expiryLabel } from '../lib/policyFilters';
import { formatPeriod, formatProduct } from '../lib/policyFormat';
import { usePolicyDetail } from '../hooks/usePolicyDetail';
import { POLICY_STATUS } from '../lib/policyStatus';
import PolicyCancellation from './PolicyCancellation';
import PolicyStatusPill from './PolicyStatusPill';
import ExpiryFlag from './ExpiryFlag';

/**
 * One policy in full, in a drawer over the list.
 *
 * A drawer and not a route, because `/business` is a single page: the list's
 * filters, sort and scroll position are component state, and sending the user
 * to `/business/:id` and back would reset all three every time they opened a
 * record. A panel keeps the list exactly as they left it.
 *
 * The trade is that a policy has no shareable URL. Worth revisiting when the
 * backend exists and someone wants to send a colleague a link — at that point
 * the list state is worth lifting into the query string anyway.
 */

/** Label above, value below — the whole panel is this one shape repeated. */
function Field({ label, value, mono = false }) {
  return (
    <div>
      <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">{label}</p>
      <p
        className={`text-sm text-on-surface ${
          mono ? 'font-data-mono text-data-mono' : 'font-medium'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/** A titled group of fields, ruled off from the one above. */
function Section({ title, children }) {
  return (
    <section className="mt-5 border-t border-slate-100 pt-4">
      <h3 className="font-label-caps text-label-caps mb-3 font-semibold uppercase text-on-surface">
        {title}
      </h3>
      {children}
    </section>
  );
}

// "PolicySchedule" → "Policy schedule".
const documentLabel = (type) => {
  if (!type) return 'Document';
  const words = type.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

function PolicyDetail({ policy, now, onClose }) {
  const closeRef = useRef(null);
  const { detail, loading, error, retry } = usePolicyDetail(policy?.policyId ?? null);

  // The list row draws the drawer at once; the full record replaces it when it lands.
  const record = detail ?? policy;

  /**
   * Escape closes, and the page behind stops scrolling while the panel is up.
   *
   * Both are undone by the same cleanup, and both are keyed on `policy` rather
   * than mounted permanently: the component renders nothing when no row is
   * selected, so a listener that outlived the panel would be swallowing Escape
   * for the whole page.
   */
  useEffect(() => {
    if (!policy) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    // Focus lands on the close button rather than the panel: it is the one
    // control in here, and it gives the keyboard a defined starting point
    // instead of leaving the tab order back at the row underneath.
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [policy, onClose]);

  return (
    <AnimatePresence>
      {policy && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Policy ${policy.policyNumber}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40"
          />

          {/* `w-full sm:max-w-md` — a full-bleed sheet on a phone, a panel from
              `sm` up. Slides from the right at every width: the same motion on
              both keeps it one component rather than a sheet and a drawer.

              `dashboard-scale` is on the panel and not on the fixed parent
              above it. The class only redefines spacing and type variables —
              no transform — so it could sit anywhere without breaking `fixed`,
              but keeping it off the positioned element makes that impossible
              to get wrong later. Without it the drawer would draw at the base
              scale over a page rendered at 85% of it, and the two type sizes
              are close enough to read as a rendering fault rather than a
              choice. */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            className="dashboard-scale relative flex h-full w-full flex-col bg-white shadow-xl sm:max-w-md"
          >
            <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-gutter">
              <div className="min-w-0">
                <p className="font-data-mono text-data-mono font-semibold text-on-surface">
                  {record.policyNumber}
                </p>
                <h2 className="font-headline-md text-headline-md truncate text-on-surface">
                  {record.customerName}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <PolicyStatusPill status={record.status} />
                  <ExpiryFlag label={expiryLabel(record, now)} />
                </div>
              </div>

              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close policy details"
                className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </header>

            {/* The panel scrolls, not the page — `overflow-y-auto` here and the
                body locked above, so a long record never scrolls the list out
                from under the drawer. */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-gutter">
              {/* Premium first and given the most weight: it is the number the
                  agent opened the record for. */}
              <div className="rounded-xl border border-gray-200 bg-surface-dim/40 p-3.5">
                <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Premium
                </p>
                <p className="font-data-currency text-headline-lg text-on-surface">
                  {formatCurrency(record.premium)}
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Sum insured {formatCurrency(record.sumInsured)}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Product" value={formatProduct(record)} />
                <Field label="Insurer" value={record.insurer || '—'} />
                <Field label="Mobile" value={record.customerMobile || '—'} mono />
                <Field label="Issued" value={formatDate(record.issuedAt)} />
                {/* Full width: the period is two dates and wraps badly in half
                    a row at this panel's width. */}
                <div className="col-span-2">
                  <Field label="Cover period" value={formatPeriod(record)} />
                </div>
              </div>

              {loading ? (
                <p className="font-body-md text-body-md mt-5 flex items-center gap-2 text-on-surface-variant">
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  Loading policy details…
                </p>
              ) : error ? (
                <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5">
                  <p className="font-body-md text-body-md text-rose-800">
                    {error?.message || "Couldn't load the rest of this policy."}
                  </p>
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-800 hover:underline"
                  >
                    <RefreshCw aria-hidden="true" className="size-3.5" />
                    Try again
                  </button>
                </div>
              ) : (
                detail && (
                  <>
                    <Section title="Insured">
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Name" value={detail.customerName || '—'} />
                        <Field label="Date of birth" value={formatDate(detail.insuredDob)} />
                      </div>
                    </Section>

                    <Section title="Nominee">
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Name" value={detail.nomineeName || '—'} />
                        <Field label="Relation" value={detail.nomineeRelation || '—'} />
                      </div>
                    </Section>

                    {(detail.cancelledAt || detail.cancellationReason) && (
                      <Section title="Cancellation">
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Cancelled on" value={formatDate(detail.cancelledAt)} />
                          <div className="col-span-2">
                            <Field label="Reason" value={detail.cancellationReason || '—'} />
                          </div>
                        </div>
                      </Section>
                    )}

                    {detail.renewedFromPolicyId && (
                      <Section title="Renewal">
                        <Field label="Renewed from" value={detail.renewedFromPolicyId} mono />
                      </Section>
                    )}

                    {detail.notes && (
                      <Section title="Notes">
                        <p className="font-body-md text-body-md whitespace-pre-line text-on-surface">
                          {detail.notes}
                        </p>
                      </Section>
                    )}

                    {detail.status === POLICY_STATUS.ACTIVE && !detail.cancelledAt && (
                      <Section title="Cancel policy">
                        <PolicyCancellation
                          key={detail.policyId}
                          policyId={detail.policyId}
                          onRequested={retry}
                        />
                      </Section>
                    )}

                    <Section title="Documents">
                      {detail.documents.length === 0 ? (
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          No documents on this policy.
                        </p>
                      ) : (
                        // ⚠ No route serves these keys yet, so they are listed, not linked.
                        <ul className="flex flex-col gap-2">
                          {detail.documents.map((doc) => (
                            <li
                              key={doc.documentId}
                              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
                            >
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-primary">
                                <FileText aria-hidden="true" className="size-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-on-surface">
                                  {documentLabel(doc.documentType)}
                                </p>
                                <p className="font-body-md text-body-md text-on-surface-variant">
                                  Uploaded {formatDate(doc.uploadedAt)}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Section>
                  </>
                )
              )}

              {/* Renew, download and endorse need endpoints that do not exist yet. */}
              <p className="font-body-md text-body-md mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-on-surface-variant">
                Renewing, downloading documents and raising an endorsement will
                appear here once the policy service supports them.
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export default PolicyDetail;
