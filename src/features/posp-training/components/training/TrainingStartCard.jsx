import {
  ArrowRight,
  Award,
  Clock,
  FileText,
  Loader2,
  PlayCircle,
  TriangleAlert,
} from "lucide-react";

const WHAT_TO_EXPECT = [
  {
    icon: Clock,
    title: "Guided coursework, at your own pace",
    detail:
      "Work through the material for your line. The clock runs from the moment you start, so plan the sittings.",
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
 * The screen between choosing a line and beginning it.
 *
 * It exists because those are two different acts: the choice is a decision the
 * POSP can take at any time, while starting sets the mandated hours running and
 * cannot be paused. Landing straight in the syllabus with a clock already
 * counting is how someone loses an evening of their period to a page they were
 * only reading.
 */
export default function TrainingStartCard({
  plan,
  starting = false,
  error = null,
  onStart,
}) {
  return (
    <div className="w-full max-w-4xl">
      <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100 sm:size-16">
        <PlayCircle
          className="size-7 text-orange-500 sm:size-8"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        You're enrolled — ready when you are
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-slate-500">
        Your {plan.name} programme is set up. Nothing is running yet: the{" "}
        {plan.requiredHours} hours begin the moment you press start.
      </p>

      <section className="relative mt-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:mt-12 sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-slate-50"
        />

        {/* Single column on phones; from lg the CTA moves into a fixed-width
            second track so the copy keeps a comfortable measure. */}
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_--spacing(60)] lg:items-center lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-800">
              <span aria-hidden="true" className="size-2 rounded-full bg-orange-600" />
              {plan.requiredHours} hours required
            </span>

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-orange-600 sm:text-3xl">
              {plan.name} certification training
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Master the fundamentals of insurance regulations, product
              knowledge, and ethical selling practices as mandated by{" "}
              <span className="font-semibold text-orange-500">IRDAI</span>.
            </p>

            <ul className="mt-7 space-y-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 sm:p-5">
              {WHAT_TO_EXPECT.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                    <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
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

          <div className="lg:border-l lg:border-slate-100 lg:pl-10">
            <button
              type="button"
              disabled={starting}
              aria-busy={starting}
              onClick={onStart}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100 sm:text-base"
            >
              {starting ? (
                <>
                  <Loader2
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Starting…
                </>
              ) : (
                <>
                  Start training
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>

            {error ? (
              <p
                role="status"
                className="mt-3 inline-flex items-start gap-1.5 text-xs leading-4 text-rose-600"
              >
                <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                {error.message}
              </p>
            ) : (
              <p className="mt-3 text-center text-xs leading-4 text-slate-400">
                Your progress will be saved automatically.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
