import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, ShieldCheck, ArrowRight, SkipForward } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import { alertOnInvalid } from "@/shared/store/alertStore";

/* ── Schema ──
 * India-aware: 6-digit PIN code (can't start with 0), and a 15-char GSTIN
 * that's only format-checked when the user actually fills it in.
 */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const businessSchema = z.object({
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
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      gstIn: "",
      ...initialValues,
      // Optionals persist as undefined — coerce back to controlled strings.
      addressLine2: initialValues?.addressLine2 ?? "",
      gstIn: initialValues?.gstIn ?? "",
    },
    mode: "onTouched",
  });

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

  const onSubmit = form.handleSubmit((data) => {
    const clean = {
      ...data,
      // Normalise empty optionals to undefined.
      addressLine2: data.addressLine2 || undefined,
      gstIn: data.gstIn || undefined,
    };
    onNext?.(clean);
  }, alertOnInvalid);

  return (
    <div className="w-full max-w-[310px] sm:max-w-[360px] lg:max-w-[390px] xl:max-w-[390px] mx-auto lg:mx-0 rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

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
          <Input
            id="businessType"
            label="Business Type *"
            placeholder="e.g. Proprietorship"
            maxLength={200}
            error={form.formState.errors.businessType?.message}
            {...form.register("businessType")}
          />

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

        {/* PIN code + GSTIN — paired on larger screens. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
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

          <Input
            id="gstIn"
            label="GSTIN"
            placeholder="15-char GSTIN (optional)"
            autoComplete="off"
            maxLength={15}
            className="font-mono tracking-[0.1em] uppercase"
            error={form.formState.errors.gstIn?.message}
            {...gstField}
            onChange={handleGstChange}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="submit" className="flex-1 flex items-center justify-center gap-2">
            Continue <ArrowRight size={16} strokeWidth={2.5} />
          </Button>
        </div>
      </form>

    </div>
  );
}
