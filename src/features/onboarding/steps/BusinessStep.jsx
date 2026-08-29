import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  SkipForward,
  Check,
  X,
  Loader2,
  MapPin,
  Info,
} from "lucide-react";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import Autocomplete from "@/shared/components/Autocomplete";
import Button from "@/shared/components/Button";
import { alertOnInvalid } from "@/shared/store/alertStore";
import { reportFormError } from "@/shared/api/formErrors";
import { useMasterOptions } from "../hooks/useMasterOptions";
import { useDistricts, usePincodeLookup } from "../hooks/useGeography";
import OptionsUnavailable from "../components/OptionsUnavailable";
import {
  fetchBusinessTypes,
  fetchStates,
  matchMasterValue,
  saveBusinessDetails,
} from "../api/onboardingApi";

/* ── Schema ──
 * India-aware: 6-digit PIN code (can't start with 0), and a 15-char GSTIN
 * that's only format-checked when the user actually fills it in.
 */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * The step asks one question before anything else — "do you have a business?"
 * — and the answer decides which half of this schema applies.
 *
 * Both gates (`hasBusiness`, `hasGst`) are form fields rather than component
 * state. They have to be: `businessType` and `businessName` are required only
 * on the Yes branch, and a resolver can only express that if the answer is in
 * the data it validates. Keeping them here also means the whole payload comes
 * out of one `handleSubmit`, with nothing merged in by hand on the way past.
 *
 * `hasBusiness` starts as `null` (unanswered) so neither branch renders until
 * the user picks. `z.boolean()` rejects `null`, which is the safety net — in
 * practice the Continue button doesn't exist yet, so it can't be reached.
 */
const businessSchema = z
  .object({
    hasBusiness: z.boolean({ error: "Let us know whether you have a business." }),

    /**
     * Optional *in the schema*, required by the refinement below on the Yes
     * branch. Declaring them required here would fail a No-business user on
     * two fields they were never shown.
     */
    businessType: z.string().trim().max(200).optional(),
    businessName: z.string().trim().max(200).optional(),

    /* Address — collected either way. For a business it's where the business
       is registered; for everyone else it's simply where they live. */
    addressLine1: z.string().trim().min(1, "Address line 1 is required.").max(200),
    addressLine2: z.string().trim().max(200, "Keep it under 200 characters.").optional(),
    /**
     * `city` and `state` are plain non-empty strings here, but the fields that
     * fill them only ever commit a name from the geography lists — see the note
     * on `Autocomplete`. So this rule fires for "typed something we don't
     * recognise" as well as for "left it blank", which is why the messages ask
     * the user to *pick* rather than to fill in.
     */
    city: z.string().trim().min(1, "Pick a city or district from the list."),
    state: z.string().trim().min(1, "Pick a state from the list."),
    pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code."),

    hasGst: z.boolean(),
    gstIn: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || GSTIN_RE.test(v), "Enter a valid 15-character GSTIN."),
  })
  .superRefine((data, ctx) => {
    if (!data.hasBusiness) return;
    if (!data.businessType) {
      ctx.addIssue({
        code: "custom",
        path: ["businessType"],
        message: "Business type is required.",
      });
    }
    if (!data.businessName) {
      ctx.addIssue({
        code: "custom",
        path: ["businessName"],
        message: "Business name is required.",
      });
    }
  });

/**
 * The Yes/No pair this step asks its two questions with.
 *
 * `value` is deliberately compared against `true`/`false` rather than tested
 * for truthiness, so an unanswered `null` highlights neither button instead of
 * making "No" look pre-picked.
 */
function ChoicePair({ value, onChange }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-4";
  const picked = "border-orange-300 bg-orange-50 text-orange-600 focus:ring-orange-200/50";
  const unpicked =
    "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 focus:ring-slate-200/50";

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={value === true}
        className={`${base} ${value === true ? picked : unpicked}`}
      >
        <Check size={16} strokeWidth={2.5} />
        Yes
      </button>

      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={value === false}
        className={`${base} ${value === false ? picked : unpicked}`}
      >
        <X size={16} strokeWidth={2.5} />
        No
      </button>
    </div>
  );
}

/**
 * What the PIN lookup found, in one line under the field.
 *
 * `notFound` is drawn in slate rather than red on purpose. An unrecognised PIN
 * is not the user's mistake to fix — it is a gap in the server's table, and the
 * form still accepts the value. Colouring it as an error would tell someone
 * their own address is wrong.
 */
function PincodeStatus({ status, data }) {
  if (status === "idle") return null;

  const line = {
    loading: {
      icon: <Loader2 size={13} strokeWidth={2.5} className="animate-spin shrink-0" />,
      tone: "text-slate-400",
      text: "Looking up your PIN code…",
    },
    found: {
      icon: <MapPin size={13} strokeWidth={2.5} className="shrink-0" />,
      tone: "text-emerald-600",
      text: data ? [data.district, data.state].filter(Boolean).join(", ") : "",
    },
    notFound: {
      icon: <Info size={13} strokeWidth={2.5} className="shrink-0" />,
      tone: "text-slate-500",
      text: "We don't have that PIN on file — pick the state and city yourself.",
    },
    error: {
      icon: <Info size={13} strokeWidth={2.5} className="shrink-0" />,
      tone: "text-slate-500",
      text: "Couldn't check that PIN just now. You can still fill the rest in.",
    },
  }[status];

  if (!line?.text) return null;

  return (
    <p className={`-mt-2 flex items-center gap-1.5 text-xs font-medium ${line.tone}`}>
      {line.icon}
      {line.text}
    </p>
  );
}

export default function BusinessStep({ onNext, onSkip, initialValues }) {
  const form = useForm({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      /**
       * `null` means "not asked yet", which is why the fallback isn't simply
       * `false`. A saved record answers this directly; inferring it from the
       * presence of a business name is the fallback for a record written
       * before `hasBusiness` existed, and it only applies when there is a
       * record at all — a first visit stays unanswered and gets the question.
       */
      hasBusiness:
        initialValues?.hasBusiness ??
        (initialValues ? Boolean(initialValues.businessName || initialValues.businessType) : null),
      businessType: "",
      businessName: "",
      addressLine1: "",
      city: "",
      state: "",
      pincode: "",
      ...initialValues,
      // Optionals persist as undefined — coerce back to controlled strings.
      // These cover the empty case too, hence no earlier `""` pair.
      addressLine2: initialValues?.addressLine2 ?? "",
      gstIn: initialValues?.gstIn ?? "",
      /**
       * "Do you have a GST number?" — same reasoning as `hasBusiness`, except
       * this one has no unanswered state: No is a fine default because it
       * hides a field rather than a whole branch. Reading the saved `hasGst`
       * first matters for someone who answered Yes and left the number blank —
       * inferring from the GSTIN alone would show them "No" on return.
       */
      hasGst: initialValues?.hasGst ?? Boolean(initialValues?.gstIn),
    },
    mode: "onTouched",
  });

  /* These four drive what renders or what gets fetched, so they're subscribed
     to rather than read. `useWatch` over `form.watch` for the same reason
     PanStep uses it — it doesn't defeat the React Compiler's memoisation. */
  const hasBusiness = useWatch({ control: form.control, name: "hasBusiness" });
  const hasGst = useWatch({ control: form.control, name: "hasGst" });
  const stateValue = useWatch({ control: form.control, name: "state" });
  const pincodeValue = useWatch({ control: form.control, name: "pincode" });

  const answered = hasBusiness === true || hasBusiness === false;

  /* ── Remote lists ──
   *
   * Every one of these is gated on something the user has actually reached.
   * Business types wait for the Yes branch — the answer that makes the
   * dropdown exist — and the geography lists wait for the gate to be answered
   * at all, which is when the address fields first render. Nothing here is
   * requested by simply arriving on the step, let alone by loading the app.
   */
  const {
    options: businessTypes,
    loading: loadingTypes,
    unavailable: typesUnavailable,
    reload: reloadTypes,
  } = useMasterOptions(fetchBusinessTypes, { enabled: hasBusiness === true });

  const { options: states, loading: loadingStates } = useMasterOptions(fetchStates, {
    enabled: answered,
  });

  /** Districts follow the chosen state, and the hook holds its own request
   *  back until there is one — so this is silent until a state is committed. */
  const { options: districts, loading: loadingDistricts } = useDistricts(stateValue, {
    enabled: answered,
  });

  /** Six digits → state, district and localities. Debounced inside the hook. */
  const lookup = usePincodeLookup(pincodeValue, { enabled: answered });

  /**
   * Reconcile anything the form already holds against a list that has just
   * arrived — the same job in three places, so it's one helper.
   *
   * Two things make it worth doing rather than trusting the stored value.
   * `businessType` used to be free text, so a value coming back from Review
   * can be anything the user once typed. And a state or district can arrive
   * from the PIN lookup, whose spelling is its own — close to the list's, but
   * not guaranteed identical. Re-matching swaps a recognisable value for the
   * list's own and drops anything else back to empty: better a required field
   * the user can still fill than a submit rejected for a value no field on
   * screen can even display.
   */
  const reconcile = (name, options) => {
    if (!options.length) return;
    const current = form.getValues(name);
    if (!current) return;
    const matched = matchMasterValue(current, options);
    if (matched !== current) form.setValue(name, matched ?? "");
  };

  useEffect(() => {
    reconcile("businessType", businessTypes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessTypes]);

  useEffect(() => {
    reconcile("state", states);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states]);

  /**
   * A district only means anything inside its state, so this runs on every new
   * district list — which is to say every time the state changes. A city left
   * over from the previous state won't match the new list and is cleared,
   * rather than being submitted as a Pune address in Gujarat.
   */
  useEffect(() => {
    reconcile("city", districts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts]);

  /**
   * The PIN's answer fills the two fields below it.
   *
   * Guarded on the current value differing, so this writes once per lookup and
   * then leaves the fields alone — someone who looks up a PIN and then edits
   * the state by hand keeps their edit. `lookup.data` only changes identity
   * when a new PIN resolves, which is what makes that true.
   *
   * `state` is set here and `city` is left to the reconcile above: setting the
   * state re-fetches the districts, and the city has to be matched against the
   * list that arrives, not the one on screen now. Writing it here as well would
   * be a value the district field can't yet display.
   */
  useEffect(() => {
    if (lookup.status !== "found" || !lookup.data) return;
    const { state: foundState, district } = lookup.data;
    if (foundState && form.getValues("state") !== foundState) {
      form.setValue("state", foundState, { shouldValidate: true });
    }
    if (district && form.getValues("city") !== district) {
      form.setValue("city", district, { shouldValidate: true });
    }
  }, [lookup.status, lookup.data, form]);

  /**
   * Answering "No" clears the business half rather than just hiding it.
   *
   * Hiding alone would leave a stale type and name in the form for the submit
   * handler to trip over, and would resurrect them if the user toggled back —
   * which is friendly for the address but wrong here, since the answer they
   * just gave is that none of it applies. The address is untouched on purpose:
   * it's asked for on both branches, so re-typing it would be busywork.
   */
  const chooseHasBusiness = (value) => {
    form.setValue("hasBusiness", value);
    form.clearErrors("hasBusiness");
    if (!value) {
      form.setValue("businessType", "");
      form.setValue("businessName", "");
      form.setValue("hasGst", false);
      form.setValue("gstIn", "");
      form.clearErrors(["businessType", "businessName", "gstIn"]);
    }
  };

  const chooseHasGst = (value) => {
    form.setValue("hasGst", value);
    if (!value) {
      // Switching to No: drop any typed GSTIN and clear its error.
      form.setValue("gstIn", "");
      form.clearErrors("gstIn");
    }
  };

  // PIN code → digits only, max 6.
  const pincodeField = form.register("pincode");
  const handlePincodeChange = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    pincodeField.onChange(e);
  };

  // GSTIN → uppercase alphanumerics, max 15.
  const gstField = form.register("gstIn");
  const handleGstChange = (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 15);
    gstField.onChange(e);
  };

  /** Localities inside the looked-up PIN, offered as one-tap fills for the
   *  optional second address line. Suggestions only — nothing is required and
   *  nothing is stored. */
  const areas = lookup.status === "found" ? lookup.data?.areas ?? [] : [];

  /**
   * Save, then advance — only on success.
   *
   * The business fields are nulled rather than trusted on the No branch. They
   * are cleared when the answer is given, so this is belt-and-braces, but it
   * is the one place that guarantees the record can never say "no business"
   * and still carry a business name.
   */
  const onSubmit = form.handleSubmit(async (data) => {
    const clean = {
      hasBusiness: data.hasBusiness,
      businessType: data.hasBusiness ? data.businessType : undefined,
      businessName: data.hasBusiness ? data.businessName : undefined,
      addressLine1: data.addressLine1,
      // Normalise empty optionals to undefined.
      addressLine2: data.addressLine2 || undefined,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      hasGst: data.hasBusiness ? data.hasGst : false,
      gstIn: data.hasBusiness && data.hasGst ? data.gstIn || undefined : undefined,
    };
    try {
      await saveBusinessDetails(clean);
      onNext?.(clean);
    } catch (error) {
      reportFormError(form, error, "Couldn't save your business details");
    }
  }, alertOnInvalid);

  return (
    /* No `overflow-hidden` here, unlike the other step cards: the address
       typeaheads drop a suggestion list below their field, and a clipped
       dropdown is worse than the squared header corner this would otherwise
       hide. The header rounds its own top instead. */
    <div className="w-full max-w-89 sm:max-w-103.5 lg:max-w-112 xl:max-w-112 mx-auto lg:mx-0 rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)]">

      {/* Header — padding and type scale with breakpoints */}
      <div className="rounded-t-2xl px-4 sm:px-5 lg:px-6 pt-5 pb-4 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
              <Building2 size={13} strokeWidth={2.5} />
              Step 7 · Business
            </span>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight">
              {hasBusiness === false ? "Your address" : "Your business details"}
            </h2>
          </div>

          {/* Optional step — skip jumps ahead without saving any business data. */}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-700 active:scale-[0.97] focus:outline-none focus:ring-4 focus:ring-slate-200/50"
            >
              Skip <SkipForward size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1 lg:mt-2">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          {hasBusiness === false
            ? "No business, no problem — we just need your address."
            : "Where your business is registered. GSTIN is optional."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="px-4 sm:px-5 lg:px-6 py-5 flex flex-col gap-4 sm:gap-5">

        {/* The gate. Everything below it depends on this answer, so nothing
            below it renders until the answer is given. */}
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold text-slate-700">
            Do you have a business?
          </span>

          <ChoicePair value={hasBusiness} onChange={chooseHasBusiness} />

          {form.formState.errors.hasBusiness && (
            <p className="text-xs sm:text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1 duration-300" role="alert">
              {form.formState.errors.hasBusiness.message}
            </p>
          )}

          {!answered && (
            <p className="text-xs text-slate-400">
              Pick one to continue — we'll only ask for what applies to you.
            </p>
          )}
        </div>

        {/* ── Business half — Yes only ─────────────────────────────────── */}
        {hasBusiness === true && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {typesUnavailable ? (
              <div className="mb-3 sm:mb-3.5">
                <span className="block mb-1 sm:mb-1.5 text-xs sm:text-sm font-semibold text-slate-700 sm:flex sm:items-end sm:min-h-[2.5rem]">
                  Business Type *
                </span>
                <OptionsUnavailable label="business types" onRetry={reloadTypes} />
              </div>
            ) : (
              <Select
                id="businessType"
                label="Business Type *"
                /* Disabled rather than hidden while the list loads: the field
                   keeps its place in the grid, so the row doesn't reflow under
                   the user the moment the request lands. */
                disabled={loadingTypes}
                options={businessTypes}
                placeholder={loadingTypes ? "Loading…" : "Select business type"}
                error={form.formState.errors.businessType?.message}
                {...form.register("businessType")}
              />
            )}

            <Input
              id="businessName"
              label="Business Name *"
              placeholder="Registered business name"
              maxLength={200}
              error={form.formState.errors.businessName?.message}
              {...form.register("businessName")}
            />
          </div>
        )}

        {/* ── Address — both branches ──────────────────────────────────── */}
        {answered && (
          <>
            <div className="flex flex-col gap-4 sm:gap-5">
              <span className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-400">
                {hasBusiness ? "Business address" : "Your address"}
              </span>

              {/* PIN first, and deliberately so: six digits fill the state and
                  the city below, so asking for it last would mean overwriting
                  two fields the user had just finished searching for. */}
              {/* Wrapped so the status line sits against its field. Loose in
                  the column it would inherit the parent's `gap` on top of the
                  input's own bottom margin, and read as a note about the next
                  field down rather than about this one. */}
              <div>
                <Input
                  id="pincode"
                  label="PIN Code *"
                  placeholder="6-digit PIN"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                  className="font-mono tracking-wide"
                  error={form.formState.errors.pincode?.message}
                  {...pincodeField}
                  onChange={handlePincodeChange}
                />

                {!form.formState.errors.pincode && (
                  <PincodeStatus status={lookup.status} data={lookup.data} />
                )}
              </div>

              {/* State + City — paired on larger screens. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Controller
                  name="state"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      id="state"
                      label="State *"
                      placeholder="Start typing…"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={states}
                      loading={loadingStates}
                      error={fieldState.error?.message}
                      emptyMessage="No state matches that"
                    />
                  )}
                />

                <Controller
                  name="city"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      id="city"
                      label="City / District *"
                      /* Districts are a per-state list, so this genuinely has
                         nothing to suggest until a state is chosen. Disabled
                         with a reason beats an open field that returns nothing
                         however carefully you type. */
                      disabled={!stateValue}
                      placeholder={stateValue ? "Start typing…" : "Pick a state first"}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={districts}
                      loading={loadingDistricts}
                      error={fieldState.error?.message}
                      emptyMessage="No district matches that"
                    />
                  )}
                />
              </div>

              <Input
                id="addressLine1"
                label="Address Line 1 *"
                placeholder="Building, street"
                maxLength={200}
                error={form.formState.errors.addressLine1?.message}
                {...form.register("addressLine1")}
              />

              {/* Wrapped for the same reason as the PIN above — the chips are
                  this field's suggestions, so they belong against it. */}
              <div>
                <Input
                  id="addressLine2"
                  label="Address Line 2"
                  placeholder="Area, landmark (optional)"
                  maxLength={200}
                  error={form.formState.errors.addressLine2?.message}
                  {...form.register("addressLine2")}
                />

                {/* The localities the PIN covers, as one-tap fills. Purely a
                    shortcut — the field stays free text either way. */}
                {areas.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      Areas in {pincodeValue}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {areas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() =>
                            form.setValue("addressLine2", area, { shouldValidate: true })
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 transition-all duration-150 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 active:scale-[0.97]"
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GSTIN gate — a business question, so it rides with that half.
                Ask first, only reveal the input on Yes. */}
            {hasBusiness === true && (
              <div className="flex flex-col gap-2.5">
                <span className="text-sm font-semibold text-slate-700">
                  Do you have a GST number?
                </span>

                <ChoicePair value={hasGst} onChange={chooseHasGst} />

                {hasGst && (
                  <Input
                    id="gstIn"
                    label="GSTIN"
                    placeholder="15-char GSTIN"
                    autoComplete="off"
                    maxLength={15}
                    className="font-mono tracking-widest uppercase"
                    error={form.formState.errors.gstIn?.message}
                    {...gstField}
                    onChange={handleGstChange}
                  />
                )}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                /* The masters list only gates the Yes branch — a No-business
                   user has no dropdown to wait for, and shouldn't be stuck
                   behind a failed fetch for a field they'll never see. The
                   geography lists gate nothing: they are typeaheads over
                   fields the schema already guards, so a slow states call
                   delays a suggestion, not the form. */
                disabled={
                  form.formState.isSubmitting ||
                  (hasBusiness === true && (loadingTypes || typesUnavailable))
                }
                className="flex-1 flex items-center justify-center gap-2"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </form>

    </div>
  );
}
