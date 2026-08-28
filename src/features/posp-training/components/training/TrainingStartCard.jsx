import { useState } from "react";
import {
  ArrowRight,
  Award,
  Check,
  Clock,
  FileText,
  Loader2,
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

const CONSENTS = [
  {
    id: "terms",
    before: "I have read and accept the ",
    name: "Terms & Conditions",
    after: " of this programme.",
  },
  {
    id: "norms",
    before: "I agree to the ",
    name: "Training Norms",
    after: " for the mandated hours.",
  },
];

/**
 * One consent line.
 *
 * The whole label is the control, which is what makes this workable on a phone:
 * a 16px box is well under any sane touch target, but the row it sits in — box,
 * gap and two lines of text — is comfortably past 44px, and tapping the sentence
 * ticks the box. `py-1` is there to guarantee that height even when the text
 * happens to fit on one line.
 *
 * The box itself is a shade larger below `sm` for the same reason: on a phone it
 * is aimed at rather than clicked, and its tick has to be legible at arm's
 * length.
 */
function ConsentCheckbox({ checked, disabled = false, onChange, children }) {
  return (
    <label
      className={`group flex items-start gap-3 py-1 sm:gap-2.5 sm:py-0 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-px flex size-4.5 shrink-0 items-center justify-center rounded border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500/40 peer-focus-visible:ring-offset-2 sm:size-4 ${
          checked
            ? "border-orange-600 bg-orange-600"
            : "border-slate-300 bg-white group-hover:border-orange-400"
        }`}
      >
        <Check
          className={`size-3 text-white transition-all duration-150 motion-reduce:transition-none ${
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
          strokeWidth={3.5}
        />
      </span>
      <span className="text-xs leading-5 text-slate-500 sm:leading-4">
        {children}
      </span>
    </label>
  );
}

export default function TrainingStartCard({
  plan,
  starting = false,
  error = null,
  onStart,
}) {
  const [accepted, setAccepted] = useState({ terms: false, norms: false });
  const allAccepted = CONSENTS.every((consent) => accepted[consent.id]);

  const toggle = (id) => (value) =>
    setAccepted((current) => ({ ...current, [id]: value }));

  return (
    <div className="w-full max-w-3xl">
      <h1 className="text-center text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
        You're enrolled — ready when you are
      </h1>
      <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-slate-500 sm:text-xs sm:leading-5">
        Your {plan.name} programme is set up. Nothing is running yet: the{" "}
        {plan.requiredHours} hours begin the moment you press start.
      </p>

      <section className="relative mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_44px_-24px_rgba(15,23,42,0.28)] sm:mt-8 sm:p-5 lg:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-14 -top-14 size-40 rounded-full bg-slate-50"
        />

        {/* Single column on phones; from lg the CTA moves into a fixed-width
            second track so the copy keeps a comfortable measure. The track is
            wide enough for the consent lines to sit above the button they gate
            — the two belong together in both layouts. */}
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_--spacing(64)] lg:items-center lg:gap-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-slate-800 sm:text-[0.625rem]">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-orange-600"
              />
              {plan.requiredHours} hours required
            </span>

            <h2 className="mt-3 text-lg font-extrabold tracking-tight text-orange-600 sm:text-xl">
              {plan.name} certification training
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 sm:text-xs sm:leading-5">
              Master the fundamentals of insurance regulations, product
              knowledge, and ethical selling practices as mandated by{" "}
              <span className="font-semibold text-orange-500">IRDAI</span>.
            </p>

            {/* Every size here steps *down* at `sm`, not up. The card is a
                deliberately compact desktop panel, and the three sizes it uses
                there — 12px titles, 11px detail — are the ones that stop being
                readable held at arm's length. Raising the floor on phones leaves
                the desktop composition exactly as drawn. */}
            <ul className="mt-5 space-y-3.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3.5 sm:space-y-3 sm:p-3.5">
              {WHAT_TO_EXPECT.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex gap-3 sm:gap-2.5">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500 sm:size-6">
                    <Icon
                      className="size-3.5 sm:size-3"
                      strokeWidth={2.25}
                      aria-hidden="true"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 sm:text-xs">
                      {title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500 sm:leading-4">
                      {detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* On a phone this block is the foot of a long card, so it gets a rule
              of its own — without it the consents read as a fourth bullet of the
              list above rather than as the gate on the button under them. From
              `lg` the rule turns vertical and becomes the column divider. */}
          <div className="border-t border-slate-100 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
            <fieldset className="space-y-1.5 sm:space-y-2.5" disabled={starting}>
              <legend className="sr-only">
                Required acceptances before starting training
              </legend>

              {CONSENTS.map(({ id, before, name, after }) => (
                <ConsentCheckbox
                  key={id}
                  checked={accepted[id]}
                  disabled={starting}
                  onChange={toggle(id)}
                >
                  {before}
                  <span className="font-semibold text-slate-700">{name}</span>
                  {after}
                </ConsentCheckbox>
              ))}
            </fieldset>

            <button
              type="button"
              disabled={starting || !allAccepted}
              aria-busy={starting}
              onClick={onStart}
              className="group mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100 sm:py-2.5"
            >
              {starting ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Starting…
                </>
              ) : (
                <>
                  Start training
                  <ArrowRight
                    className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>

            {/* Three states, one slot. The "why is this disabled" line is muted
                rather than red — nothing has gone wrong yet, and a warning
                colour on a form nobody has filled in reads as an accusation. */}
            {error ? (
              <p
                role="status"
                className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-rose-600 sm:text-[0.6875rem] sm:leading-4"
              >
                <TriangleAlert
                  className="mt-0.5 size-3 shrink-0"
                  aria-hidden="true"
                />
                {error.message}
              </p>
            ) : (
              <p className="mt-2 text-center text-xs leading-5 text-slate-400 sm:text-[0.6875rem] sm:leading-4">
                {allAccepted
                  ? "Your progress will be saved automatically."
                  : "Accept both to begin."}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
