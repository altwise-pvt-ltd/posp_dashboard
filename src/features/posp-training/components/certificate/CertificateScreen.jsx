import { ArrowRight, BadgeCheck, Clock, Loader2, Printer, TriangleAlert } from 'lucide-react';
import { useCertificate } from '../../hooks/useCertificate';
import { formatCertificateDate } from '../../data/certificate';
import PospCertificate from './PospCertificate';

/**
 * The shell every state below sits in — slate, so the sheet reads as paper on a
 * desk, and full height so a one-card state doesn't float in a short page.
 */
function CertificateShell({ children }) {
  return <div className="flex min-h-screen w-full flex-col bg-slate-200">{children}</div>;
}

/** One centred card, for the three states that have no sheet to show. */
function CertificateNotice({ icon, tone, title, body, action }) {
  return (
    <div className="flex w-full flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-300/70 bg-white p-6 text-center shadow-[0_18px_44px_-24px_rgba(15,23,42,0.28)]">
        <span className={`mx-auto flex size-9 items-center justify-center rounded-lg ${tone}`}>
          {icon}
        </span>

        <h1 className="mt-4 text-base font-extrabold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">{body}</p>

        {action}
      </div>
    </div>
  );
}

const RETRY_CLASS =
  'mt-5 inline-flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98]';

/**
 * The certificate screen — what a learner sees the moment they have passed.
 *
 * Two layers, and the split is what makes printing work: the bar is the app
 * talking (app typeface, app orange, `cert-no-print`), and the sheet below it
 * is the document (its own faces, its own navy and gold, inside
 * `cert-print-root`). Print hides everything but that root, so the learner gets
 * the certificate on A4 rather than a screenshot of a dashboard.
 *
 * What it prints is the server's, not this app's. It used to draw `DEMO_HOLDER`
 * — a fictional name, PAN and Aadhaar — against today's date, which made every
 * certificate this app produced a convincing document about nobody. It now asks
 * `GET /certificates/me` for the certificate and `GET /posp/me` for the person
 * holding it (see `useCertificate`), and shows nothing at all until both have
 * answered.
 *
 * Four states, and three of them are cards rather than sheets:
 *   loading    — the two calls in flight
 *   error      — one of them failed; the sheet is not drawn from half the data
 *   not issued — a 404, which is ordinary: the pass is recorded and the document
 *                has not been generated yet
 *   issued     — the certificate
 *
 * The fetch lives here rather than in the callers because there are two of them
 * — the exam portal after a pass, and the training page for a POSP who was
 * already certified — and neither has anything to add to it.
 */
function CertificateScreen({ sections, onGoToDashboard }) {
  const { certificate, holder, issued, issuedOn, loading, error, retry } = useCertificate();

  if (loading) {
    return (
      <CertificateShell>
        <div
          role="status"
          aria-live="polite"
          className="flex w-full flex-1 flex-col items-center justify-center gap-3 py-10"
        >
          <Loader2
            className="size-5 animate-spin text-orange-600 motion-reduce:animate-none"
            aria-hidden="true"
          />
          <p className="text-xs text-slate-500">Fetching your certificate…</p>
        </div>
      </CertificateShell>
    );
  }

  if (error) {
    return (
      <CertificateShell>
        <CertificateNotice
          tone="bg-rose-50 text-rose-600"
          icon={<TriangleAlert className="size-4" aria-hidden="true" />}
          title="Couldn't load your certificate"
          body={error.message}
          action={
            <button type="button" onClick={retry} className={RETRY_CLASS}>
              Try again
            </button>
          }
        />
      </CertificateShell>
    );
  }

  /**
   * Passed, but the document isn't cut yet.
   *
   * Deliberately not an error. The server generates the certificate on its own
   * beat and a POSP can reach this screen in the seconds between the two, so the
   * honest thing is to say what has happened — they have passed — and offer the
   * press again rather than to imply something broke.
   */
  if (!issued) {
    return (
      <CertificateShell>
        <CertificateNotice
          tone="bg-amber-50 text-amber-600"
          icon={<Clock className="size-4" aria-hidden="true" />}
          title="Your certificate is being prepared"
          body="You've passed — the document is still being issued. This usually takes a moment."
          action={
            <button type="button" onClick={retry} className={RETRY_CLASS}>
              Check again
            </button>
          }
        />
      </CertificateShell>
    );
  }

  return (
    <CertificateShell>
      <div className="cert-no-print sticky top-0 z-30 border-b border-slate-300/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ring-1 ${
                certificate.expired
                  ? 'bg-amber-50 text-amber-600 ring-amber-100'
                  : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
              }`}
            >
              <BadgeCheck className="size-5" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                Your POSP certificate
              </h1>
              {/* The server's own dates, and the one place they are worth
                  stating outside the sheet: a lapsed certificate looks
                  identical on paper, so the bar is what says so. */}
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {holder.name} · {certificate.number}
                {certificate.expiresAt && (
                  <>
                    {' · '}
                    {certificate.expired ? 'Expired on ' : 'Valid until '}
                    {formatCertificateDate(new Date(certificate.expiresAt))}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-orange-200 hover:text-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/25"
            >
              <Printer className="size-4" strokeWidth={2.25} aria-hidden="true" />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={onGoToDashboard}
              className="group flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98]"
            >
              Go to Dashboard
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      <div className="cert-print-root anim-fade flex w-full flex-1 justify-center px-4 py-8 md:py-10">
        {/* `issuedOn` is the server's stamp, not `new Date()`. A certificate
            reopened next month must still say when it was issued. */}
        <PospCertificate holder={holder} sections={sections} issuedOn={issuedOn ?? undefined} />
      </div>
    </CertificateShell>
  );
}

export default CertificateScreen;
