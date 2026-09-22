import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { expiryLabel } from '../lib/policyFilters';
import { formatPeriod, formatProduct } from '../lib/policyFormat';
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

function PolicyDetail({ policy, now, onClose }) {
  const closeRef = useRef(null);

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
                  {policy.policyNumber}
                </p>
                <h2 className="font-headline-md text-headline-md truncate text-on-surface">
                  {policy.customerName}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <PolicyStatusPill status={policy.status} />
                  <ExpiryFlag label={expiryLabel(policy, now)} />
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
                  {formatCurrency(policy.premium)}
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Sum insured {formatCurrency(policy.sumInsured)}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Product" value={formatProduct(policy)} />
                <Field label="Insurer" value={policy.insurer || '—'} />
                <Field label="Mobile" value={policy.customerMobile || '—'} mono />
                <Field label="Issued" value={formatDate(policy.issuedAt)} />
                {/* Full width: the period is two dates and wraps badly in half
                    a row at this panel's width. */}
                <div className="col-span-2">
                  <Field label="Cover period" value={formatPeriod(policy)} />
                </div>
              </div>

              {/*
                ⚠ Remove with the mock. Renew, download and endorse are the
                three actions this panel is missing, and every one of them needs
                an endpoint that does not exist. Saying so here is better than a
                row of buttons that do nothing.
              */}
              <p className="font-body-md text-body-md mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-on-surface-variant">
                Renewing, downloading the policy document and raising an
                endorsement will appear here once the policy service is connected.
              </p>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export default PolicyDetail;
