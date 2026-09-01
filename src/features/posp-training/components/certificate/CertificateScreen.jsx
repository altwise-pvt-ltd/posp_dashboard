import { ArrowRight, BadgeCheck, Clock, ExternalLink, Loader2, TriangleAlert } from 'lucide-react';
import { useCertificate } from '../../hooks/useCertificate';
import { formatCertificateDate } from '../../data/certificate';

/**
 * The shell every state below sits in — slate, so the sheet reads as paper on a
 * desk, and full height so a one-card state doesn't float in a short page.
 */
function CertificateShell({ children }) {
  return <div className="flex min-h-screen w-full flex-col bg-slate-200">{children}</div>;
}

/** One centred card, for the states that have no sheet to show. */
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

/* The way out of the states that have no sheet. Without it these cards are a
   dead end: this screen is full-bleed, so there is no app chrome behind them to
   navigate with, and "Try again" on a certificate that isn't cut yet can be
   pressed all afternoon. */
const EXIT_CLASS =
  'mt-2 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-xs font-bold text-slate-500 transition-colors duration-200 hover:text-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/25';

/**
 * The certificate screen — what a learner sees the moment they have passed.
 *
 * The document is the server's file, not this app's CSS. It used to be drawn
 * here from `GET /posp/me` and a hand-built A4 sheet; the backend renders the
 * real thing and `certificateUrl` on `GET /certificates/me` points at it, so
 * this screen fetches it and frames it. What a POSP sees is now byte-identical
 * to what the issuer holds — which a re-implementation in CSS could only ever
 * approximate, and would silently drift from the day the issuer changed it.
 *
 * That also removes the print seam. The old sheet was DOM, so printing meant
 * `window.print()` plus CSS that hid the rest of the page. A file in a frame is
 * not this document's to print — the browser's own viewer prints and saves it,
 * and the bar links out to it rather than pretending otherwise.
 *
 * Five states, and four of them are cards rather than sheets:
 *   loading     — the record, then the file
 *   error       — either call failed
 *   not issued  — a 404; the pass is recorded, the document isn't cut yet
 *   no file     — a record whose `certificateUrl` is empty
 *   issued      — the certificate
 *
 * The fetch lives here rather than in the callers because there are three of
 * them — `/certificate`, the exam portal after a pass, and the training page for
 * a POSP who was already certified — and none has anything to add to it.
 *
 * Where the exit button goes is the caller's to say, because they are reached
 * from different places: the post-exam paths are the end of the funnel and lead
 * forward to the dashboard, while `/certificate` is opened from the profile and
 * has to lead back to it. A hardcoded "Go to Dashboard" was the only way off
 * this screen, which made every visit to it a one-way trip.
 */
function CertificateScreen({
  actionLabel = 'Go to Dashboard',
  actionIcon: ActionIcon = ArrowRight,
  onAction,
}) {
  const { certificate, file, issued, loading, error, retry } = useCertificate();

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
            <>
              <button type="button" onClick={retry} className={RETRY_CLASS}>
                Try again
              </button>
              <button type="button" onClick={onAction} className={EXIT_CLASS}>
                {actionLabel}
              </button>
            </>
          }
        />
      </CertificateShell>
    );
  }

  /**
   * Passed, but there is nothing to frame yet — either no record at all (404)
   * or a record whose file hasn't been rendered.
   *
   * Deliberately not an error, and deliberately one screen for both. The server
   * cuts the record and renders the document on its own beat and a POSP can
   * reach here in between, so the honest thing is to say what has happened —
   * they have passed — and offer the press again. The distinction between the
   * two is real but it is the issuer's business, not the learner's.
   */
  if (!issued || !file) {
    return (
      <CertificateShell>
        <CertificateNotice
          tone="bg-amber-50 text-amber-600"
          icon={<Clock className="size-4" aria-hidden="true" />}
          title="Your certificate is being prepared"
          body="You've passed — the document is still being issued. This usually takes a moment."
          action={
            <>
              <button type="button" onClick={retry} className={RETRY_CLASS}>
                Check again
              </button>
              <button type="button" onClick={onAction} className={EXIT_CLASS}>
                {actionLabel}
              </button>
            </>
          }
        />
      </CertificateShell>
    );
  }

  return (
    <CertificateShell>
      <div className="sticky top-0 z-30 border-b border-slate-300/70 bg-white/95 backdrop-blur">
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
                {certificate.number}
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
            {/* A link, not a print button. The document is a file in a frame,
                and the viewer that opens it is what prints and saves it. */}
            <a
              href={file.src}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-orange-200 hover:text-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/25"
            >
              <ExternalLink className="size-4" strokeWidth={2.25} aria-hidden="true" />
              Open / Print
            </a>

            <button
              type="button"
              onClick={onAction}
              className="group flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98]"
            >
              {actionLabel}
              <ActionIcon
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      <div className="anim-fade flex w-full flex-1 justify-center px-4 py-8 md:py-10">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-300/70 bg-white shadow-[0_18px_44px_-24px_rgba(15,23,42,0.28)]">
          {file.kind === 'image' ? (
            <img src={file.src} alt="Your POSP certificate" className="block w-full" />
          ) : (
            /* A4 is taller than it is wide, so the frame is sized off the
               viewport rather than an aspect ratio — a full sheet fitted to this
               column's width would leave most of a tall screen empty and most of
               a short one scrolled. */
            <iframe
              src={file.src}
              title="Your POSP certificate"
              className="block h-[78vh] min-h-125 w-full"
            />
          )}
        </div>
      </div>
    </CertificateShell>
  );
}

export default CertificateScreen;
