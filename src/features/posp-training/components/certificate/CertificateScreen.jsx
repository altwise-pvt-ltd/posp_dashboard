import { ArrowRight, BadgeCheck, Printer } from 'lucide-react';
import { DEMO_HOLDER } from '../../data/certificate';
import PospCertificate from './PospCertificate';

/**
 * The certificate screen — what a learner sees the moment they have passed.
 *
 * Two layers, and the split is what makes printing work: the bar is the app
 * talking (app typeface, app orange, `cert-no-print`), and the sheet below it
 * is the document (its own faces, its own navy and gold, inside
 * `cert-print-root`). Print hides everything but that root, so the learner gets
 * the certificate on A4 rather than a screenshot of a dashboard.
 *
 * The backdrop is slate rather than white so the sheet reads as paper sitting
 * on a desk — the same reason the standalone mockup used a grey body.
 */
function CertificateScreen({ holder = DEMO_HOLDER, sections, onGoToDashboard }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-200">
      <div className="cert-no-print sticky top-0 z-30 border-b border-slate-300/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <BadgeCheck className="size-5" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                Your POSP certificate
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Issued to {holder.name} — save a copy before you continue.
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
        <PospCertificate holder={holder} sections={sections} />
      </div>
    </div>
  );
}

export default CertificateScreen;
