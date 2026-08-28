import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Fingerprint, Loader2, ShieldCheck, Upload } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import FileUpload from "@/shared/components/FileUpload";
import { fileField } from "@/shared/upload/schema";
import { alertOnInvalid } from "@/shared/store/alertStore";
import { reportFormError } from "@/shared/api/formErrors";
import { submitAadhaarDetails } from "../api/onboardingApi";

/* ── Schema ── */
const aadhaarSchema = z.object({
  // Stored without spaces; the field formats display as XXXX XXXX XXXX.
  aadhaar:  z.string().refine((v) => /^[0-9]{12}$/.test(v.replace(/\s/g, "")), "Aadhaar must be 12 digits."),
  fullName: z.string().trim().min(1, "Name is required.").max(200),
  aadhaarFrontImage: fileField({ message: "Please upload the front of your Aadhaar." }),
  aadhaarBackImage:  fileField({ message: "Please upload the back of your Aadhaar." }),
});

const formatAadhaar = (digits) => digits.replace(/(.{4})/g, "$1 ").trim();

export default function AadhaarStep({ onNext, initialValues }) {
  const form = useForm({
    resolver: zodResolver(aadhaarSchema),
    defaultValues: {
      fullName: "", aadhaarFrontImage: undefined, aadhaarBackImage: undefined,
      ...initialValues,
      // Saved value is bare 12 digits — re-format for the spaced display field.
      // Covers the empty case too, which is why there is no earlier `aadhaar: ""`.
      aadhaar: initialValues?.aadhaar ? formatAadhaar(initialValues.aadhaar) : "",
    },
    mode: "onTouched",
  });

  const aadhaarField = form.register("aadhaar");
  const handleAadhaarChange = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 12);
    e.target.value = formatAadhaar(digits); // RHF reads this formatted value; schema strips spaces
    aadhaarField.onChange(e);
  };

  /**
   * Save to the server, then advance — in that order, and only on success, so
   * a rejected upload leaves the user on the step with their files still
   * attached rather than one screen past it.
   *
   * No `fallbackField`: a rejection could be about the number, the name or
   * either image, and blaming one input for another's fault is worse than
   * leaving the message in the toast. A server that names a field still gets it
   * placed exactly.
   */
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await submitAadhaarDetails(data);
      onNext?.({ ...data, aadhaar: data.aadhaar.replace(/\s/g, "") }); // pass clean 12 digits onward
    } catch (error) {
      reportFormError(form, error, "Couldn't save your Aadhaar details");
    }
  }, alertOnInvalid);

  return (
    <div className="w-full max-w-77.5 sm:max-w-90 lg:max-w-97.5 xl:max-w-97.5 mx-auto lg:mx-0 rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-5 pb-4 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <Fingerprint size={13} strokeWidth={2.5} />
          Step 3 · Aadhaar Details
        </span>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight">
          Add your Aadhaar card
        </h2>
        <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1 lg:mt-2">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          Your data is encrypted and protected by LetsInsurance.
        </p>
      </div>

      {/* ── Aadhaar details + documents ── */}
      <form onSubmit={onSubmit} className="px-4 sm:px-5 lg:px-6 py-5 flex flex-col gap-4 sm:gap-5">
        <Input
          id="aadhaar"
          label="Aadhaar Number *"
          placeholder="XXXX XXXX XXXX"
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          error={form.formState.errors.aadhaar?.message}
          className="font-mono tracking-[0.2em] text-sm sm:text-base"
          {...aadhaarField}
          onChange={handleAadhaarChange}
        />

        <Input
          id="fullName"
          label="Name (as on Aadhaar) *"
          placeholder="Your full name"
          maxLength={200}
          error={form.formState.errors.fullName?.message}
          {...form.register("fullName")}
        />

        <Controller name="aadhaarFrontImage" control={form.control} render={({ field }) => (
          <FileUpload
            id="aadhaarFrontImage"
            label="Aadhaar Front"
            required
            error={form.formState.errors.aadhaarFrontImage?.message}
            hint="Front side showing your photo and name."
            onChange={field.onChange}
          />
        )} />

        <Controller name="aadhaarBackImage" control={form.control} render={({ field }) => (
          <FileUpload
            id="aadhaarBackImage"
            label="Aadhaar Back"
            required
            error={form.formState.errors.aadhaarBackImage?.message}
            hint="Back side showing your address."
            onChange={field.onChange}
          />
        )} />

        <div className="flex gap-3 pt-1">
          {/* Disabled while the upload is out — two images make this the longest
              round trip in the wizard, and the easiest to double-submit. */}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Upload size={16} strokeWidth={2.5} /> Submit Aadhaar
              </>
            )}
          </Button>
        </div>
      </form>

    </div>
  );
}
