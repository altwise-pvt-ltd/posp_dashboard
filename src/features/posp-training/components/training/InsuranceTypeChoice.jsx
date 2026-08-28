import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  HeartPulse,
  Layers,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

/**
 * Icon per option, chosen from the name so a fourth line added on the server
 * still renders — it falls back to the combined mark rather than nothing.
 */
const iconFor = (name = "") => {
  const text = name.toLowerCase();
  if (text.includes("both")) return Layers;
  if (text.includes("life")) return HeartPulse;
  if (text.includes("general")) return ShieldCheck;
  return Layers;
};

const isBoth = (name = "") => name.toLowerCase().includes("both");

/**
 * What each option means in practice, in the POSP's terms — the API sends a name
 * and a number of hours, which says what they'll do but not what it's for.
 *
 * "Both" gets the longest entry on purpose: the name alone is the one that says
 * nothing, and it is the option most likely to be picked without being
 * understood, since it is also the default.
 */
const blurbFor = (name = "") => {
  if (isBoth(name))
    return "Life and General together — you study both syllabuses and sit both exam papers. It's twice the hours, and it's the only option that leaves no product you can't sell.";
  const text = name.toLowerCase();
  if (text.includes("life"))
    return "Term, endowment and ULIP products — policies that pay out on life events. You won't be licensed to sell motor or health cover.";
  if (text.includes("general"))
    return "Motor, health, travel and property — everything other than life cover. You won't be licensed to sell life policies.";
  return "Covered by your certification once the hours and the exam are done.";
};

/**
 * The first thing on `/posp-training`: which line the POSP is certifying in.
 *
 * A real fork, not a preference — it sets the syllabus, the exam sections and
 * the mandated hours, so it is asked before the clock starts rather than being
 * changed later from a settings panel.
 */
export default function InsuranceTypeChoice({
  types,
  loading,
  error,
  onRetry,
  onConfirm,
  submitting = false,
  submitError = null,
}) {
  /** Only what the POSP actually clicked. The default is derived, not stored —
   *  state seeded from a list that arrives later is state that can be wrong. */
  const [chosenId, setChosenId] = useState(null);

  /**
   * "Both" until they say otherwise: it is the widest licence and the one a POSP
   * can't be under-qualified by, so it is the safe default to be wrong about.
   * Falls back to the first option if the server ever stops sending it.
   */
  const fallback = types.find((type) => isBoth(type.name)) ?? types[0] ?? null;
  const selected = types.find((type) => type.id === chosenId) ?? fallback;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="anim-fade text-center">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
          <span aria-hidden="true" className="size-2 rounded-full bg-orange-600" />
          Step 1 of your programme
        </span>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          What will you be selling?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Your choice sets the syllabus you study, the sections you're examined
          on, and the hours IRDAI requires before the exam opens. It can't be
          changed once the clock starts — so we've started you on{" "}
          <span className="font-semibold text-slate-700">Both</span>, which
          licenses you for every product.
        </p>
      </header>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          Loading your options…
        </div>
      )}

      {error && (
        <div className="anim-fade mt-10 rounded-2xl border border-rose-100 bg-rose-50/60 p-5 text-center">
          <TriangleAlert
            className="mx-auto size-5 text-rose-500"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm font-bold text-slate-800">
            Couldn't load your training options
          </p>
          <p className="mt-1 text-xs text-slate-500">{error.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:border-rose-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Radios, not buttons: one of three, and arrow keys should move
              between them the way a native group does. */}
          <div
            role="radiogroup"
            aria-label="Insurance line"
            className="anim-fade-d1 mt-8 grid gap-4 sm:grid-cols-3"
          >
            {types.map((type) => {
              const Icon = iconFor(type.name);
              const isSelected = type.id === selected?.id;

              return (
                <label
                  key={type.id}
                  className={`group relative flex cursor-pointer flex-col rounded-2xl border bg-white p-5 text-left transition-all duration-200 focus-within:ring-4 focus-within:ring-orange-500/20 ${
                    isSelected
                      ? "border-orange-500 shadow-lg shadow-orange-600/10"
                      : "border-slate-200 hover:border-orange-200 hover:shadow-md"
                  }`}
                >
                  <input
                    type="radio"
                    name="insurance-type"
                    value={type.id}
                    checked={isSelected}
                    disabled={submitting}
                    onChange={() => setChosenId(type.id)}
                    className="sr-only"
                  />

                  <span
                    className={`flex size-10 items-center justify-center rounded-xl transition-colors ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-orange-50 text-orange-500"
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={2.25} aria-hidden="true" />
                  </span>

                  <span className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold text-slate-900">
                      {type.name}
                    </span>

                    {isBoth(type.name) && (
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-orange-600 ring-1 ring-orange-100">
                        Recommended
                      </span>
                    )}
                  </span>

                  <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-orange-600">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {type.requiredHours} hours required
                  </span>

                  <span className="mt-3 text-xs leading-5 text-slate-500">
                    {blurbFor(type.name)}
                  </span>

                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-orange-500 text-white"
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="anim-fade-d2 mt-8 flex flex-col items-center gap-2">
            <button
              type="button"
              disabled={!selected || submitting}
              aria-busy={submitting}
              onClick={() => onConfirm(selected)}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100 sm:w-auto sm:px-8"
            >
              {submitting ? (
                <>
                  <Loader2
                    className="size-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Setting up your programme
                </>
              ) : (
                <>
                  {selected
                    ? `Start ${selected.name} training`
                    : "Select a line to continue"}
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-disabled:translate-x-0"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>

            {submitError ? (
              <p
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600"
              >
                <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                {submitError.message}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                {selected
                  ? `Your ${selected.requiredHours}-hour clock starts on the next screen.`
                  : "The clock only starts once you've chosen."}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
