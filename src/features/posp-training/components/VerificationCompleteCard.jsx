import { ArrowRight, Award, Check, Clock, FileText } from "lucide-react";

/**
 * What the learner is signing up for. Deliberately describes the programme
 * rather than previewing a specific chapter — the syllabus lives on the next
 * screen, and naming a chapter here means two places to update when it changes.
 */
const WHAT_TO_EXPECT = [
  {
    icon: Clock,
    title: "15 hours of guided coursework",
    detail:
      "Work through the General and Life Insurance modules at your own pace. The clock runs while you study.",
  },
  {
    icon: FileText,
    title: "Study material for every chapter",
    detail:
      "Each module ships with downloadable PDFs covering products, regulation and process.",
  },
  {
    icon: Award,
    title: "Certification exam at the end",
    detail:
      "Once your hours are complete the exam unlocks, and your POSP certificate follows.",
  },
];

/**
 * VerificationCompleteCard — the "documents verified, start your training"
 * screen.
 *
 * Rendered in two places, which is why it's a component rather than page
 * markup: the /verification-complete page (Start Training routes to the
 * training module) and the opening state of TrainingPage (Start Training
 * flips the page into the module list in place). `onStart` is the only
 * difference between the two.
 */
export default function VerificationCompleteCard({ onStart }) {
  return (
    <div className="w-full max-w-4xl">
      {/* ── Confirmation ───────────────────────────────────────────── */}
      <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100 sm:size-16">
        <Check
          className="size-7 text-orange-500 sm:size-8"
          strokeWidth={3}
          aria-hidden="true"
        />
      </div>

      <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Verification Complete!
      </h1>

      {/* ── Training card ──────────────────────────────────────────── */}
      {/* Single column on phones; from lg the CTA moves into a fixed-width
          second track so the copy keeps a comfortable measure. */}
      <section className="relative mt-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:mt-12 sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-slate-50"
        />

        {/* The CTA track is written as a spacing calc rather than a flat 15rem
            so .training-scale reaches it — see index.css. */}
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_--spacing(60)] lg:items-center lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-800">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-orange-600"
              />
              15 Hours Required
            </span>

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-orange-600 sm:text-3xl">
              POSP Certification Training
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Master the fundamentals of insurance regulations, product
              knowledge, and ethical selling practices as mandated by{" "}
              <span className="font-semibold text-orange-500">IRDAI</span>.
            </p>
            {/* <p className="mx-auto mt-2 max-w-2xl text-start text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
                 All your documents have been successfully verified. You are now ready to
                  begin your mandatory 15-hour POSP training program and take the next
                  step in your insurance career.
            </p> */}

            {/* What the programme involves */}
            <ul className="mt-7 space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 sm:p-5">
              {WHAT_TO_EXPECT.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                    <Icon
                      className="size-4"
                      strokeWidth={2.25}
                      aria-hidden="true"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:text-sm">
                      {detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── CTA ────────────────────────────────────────────────── */}
          <div className="lg:border-l lg:border-slate-100 lg:pl-10">
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] sm:text-base"
            >
              Start Training
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
            <p className="mt-3 text-center text-xs leading-4 text-slate-400">
              Your progress will be saved automatically.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
