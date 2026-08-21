import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

const businessSchema = z.object({
  /**
   * Was free text, is now one of the server's `business-types` values. The
   * rule is unchanged — a non-empty string — because the dropdown can only
   * hold an option the server supplied, so there is nothing left for a literal
   * union here to catch except a list that has drifted out of date.
   */
  businessType: z.string().trim().min(1, "Business type is required.").max(200),
  businessName: z.string().trim().min(1, "Business name is required.").max(200),
  addressLine1: z.string().trim().min(1, "Address line 1 is required.").max(200),
  addressLine2: z.string().trim().max(200, "Keep it under 200 characters.").optional(),
  city: z.string().trim().min(1, "City is required.").max(100),
  state: z.string().trim().min(1, "State is required.").max(100),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code."),
  gstIn: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || GSTIN_RE.test(v), "Enter a valid 15-character GSTIN."),
});

export default function BusinessStep({ onNext, onSkip, initialValues }) {
  const form = useForm({
    resolver: zodResolver(businessSchema),
    defaultValues: {
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
    },
    mode: "onTouched",
  });

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
   * "Do you have a GST number?" — the GSTIN input only appears on Yes.
   *
   * The saved record answers this directly now that `hasGst` is a field in its
   * own right, so that is what seeds the toggle. Inferring it from whether a
   * GSTIN is present is the fallback, and only right when there is no explicit
   * answer to read: someone who said Yes and left the number blank would
   * otherwise come back to a form saying they'd said No.
   */
  const [hasGst, setHasGst] = useState(
    initialValues?.hasGst ?? Boolean(initialValues?.gstIn)
  );

  const chooseHasGst = (value) => {
    setHasGst(value);
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
   * `hasGst` is carried in explicitly because it lives in component state
   * rather than the form: it gates whether the GSTIN input renders at all, and
   * the server stores it as a field in its own right. Answering "No" is a fact
   * about the business, not the absence of one, and without this it never left
   * the browser.
   */
  const onSubmit = form.handleSubmit(async (data) => {
    const clean = {
      ...data,
      // Normalise empty optionals to undefined.
      addressLine2: data.addressLine2 || undefined,
      hasGst,
      gstIn: hasGst ? data.gstIn || undefined : undefined,
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
              Your business details
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
          Where your business is registered. GSTIN is optional.
        </p>
      </div>

      <form onSubmit={onSubmit} className="px-4 sm:px-5 lg:px-6 py-5 flex flex-col gap-4 sm:gap-5">

        {/* Business type + name — paired on larger screens. */}
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

        {/* GSTIN gate — ask first, only reveal the input on Yes. */}
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold text-slate-700">
            Do you have a GST number?
          </span>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => chooseHasGst(true)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-4 ${
                hasGst
                  ? "border-orange-300 bg-orange-50 text-orange-600 focus:ring-orange-200/50"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 focus:ring-slate-200/50"
              }`}
            >
              <Check size={16} strokeWidth={2.5} />
              Yes
            </button>

            <button
              type="button"
              onClick={() => chooseHasGst(false)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-4 ${
                !hasGst
                  ? "border-orange-300 bg-orange-50 text-orange-600 focus:ring-orange-200/50"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 focus:ring-slate-200/50"
              }`}
            >
              <X size={16} strokeWidth={2.5} />
              No
            </button>
          </div>

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

        <div className="flex gap-3 pt-1">
          <Button
            type="submit"
            disabled={loadingTypes || typesUnavailable || form.formState.isSubmitting}
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
      </form>

    </div>
  );
}
