import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, ShieldCheck, ArrowRight, SkipForward, Check, X, Loader2 } from "lucide-react";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import Button from "@/shared/components/Button";
import { alertOnInvalid } from "@/shared/store/alertStore";
import { reportFormError } from "@/shared/api/formErrors";
import { useMasterOptions } from "../hooks/useMasterOptions";
import OptionsUnavailable from "../components/OptionsUnavailable";
import {
  fetchBusinessTypes,
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
    city: z.string().trim().min(1, "City is required.").max(100),
    state: z.string().trim().min(1, "State is required.").max(100),
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

  /* Both gates drive what renders, so they're subscribed to rather than read.
     `useWatch` over `form.watch` for the same reason PanStep uses it — it
     doesn't defeat the React Compiler's memoisation of this component. */
  const hasBusiness = useWatch({ control: form.control, name: "hasBusiness" });
  const hasGst = useWatch({ control: form.control, name: "hasGst" });
  const answered = hasBusiness === true || hasBusiness === false;

  const {
    options: businessTypes,
    loading: loadingTypes,
    unavailable: typesUnavailable,
    reload: reloadTypes,
  } = useMasterOptions(fetchBusinessTypes);

  /**
   * Reconcile anything the form already holds against the fetched list.
   *
   * This field used to be free text, so a value coming back from Review could
   * be anything the user typed. Re-matching swaps a recognisable one for the
   * server's spelling and drops anything else back to the placeholder — better
   * an empty required field than a submit rejected for a value the dropdown
   * can no longer even display.
   */
  useEffect(() => {
    if (!businessTypes.length) return;
    const current = form.getValues("businessType");
    if (!current) return;
    form.setValue("businessType", matchMasterValue(current, businessTypes) ?? "");
  }, [businessTypes, form]);

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
    <div className="w-full max-w-77.5 sm:max-w-90 lg:max-w-97.5 xl:max-w-97.5 mx-auto lg:mx-0 rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-5 pb-4 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
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

              <Input
                id="addressLine1"
                label="Address Line 1 *"
                placeholder="Building, street"
                maxLength={200}
                error={form.formState.errors.addressLine1?.message}
                {...form.register("addressLine1")}
              />

              <Input
                id="addressLine2"
                label="Address Line 2"
                placeholder="Area, landmark (optional)"
                maxLength={200}
                error={form.formState.errors.addressLine2?.message}
                {...form.register("addressLine2")}
              />

              {/* City + State — paired on larger screens. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Input
                  id="city"
                  label="City *"
                  placeholder="e.g. Pune"
                  maxLength={100}
                  error={form.formState.errors.city?.message}
                  {...form.register("city")}
                />

                <Input
                  id="state"
                  label="State *"
                  placeholder="e.g. Maharashtra"
                  maxLength={100}
                  error={form.formState.errors.state?.message}
                  {...form.register("state")}
                />
              </div>

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
                   behind a failed fetch for a field they'll never see. */
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
