import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Fingerprint, Loader2, ShieldCheck, Upload } from "lucide-react";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import CustomButton from "@/shared/components/CustomButton";
import FileUpload from "@/shared/components/FileUpload";
import { fileField } from "@/shared/upload/schema";
import { personNameField } from "@/shared/validation/nameField";
import { dateOfBirthField, formatDobInput } from "@/shared/validation/dateOfBirthField";
import {
  aadhaarField,
  formatAadhaar,
  formatAadhaarInput,
  stripAadhaar,
} from "@/shared/validation/aadhaarField";
import { maskedField } from "@/shared/validation/inputMask";
import { alertOnInvalid } from "@/shared/store/alertStore";
import { reportFormError } from "@/shared/api/formErrors";
import { submitAadhaarDetails } from "../api/onboardingApi";
import { useDocumentFiles } from "../hooks/useDocumentFiles";

/**
 * The genders the field offers.
 *
 * A plain local list rather than a masters fetch, because there is no masters
 * endpoint for it — `gender` is a free `string` on `AadhaarSaveRequest` with no
 * enum behind it, so these are the app's own words and the server stores them
 * verbatim. `value` and `label` are deliberately identical for that reason:
 * there is no server spelling to match, so inventing a divergent code would be
 * this form making up a vocabulary nothing else speaks.
 */
const GENDERS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

/* ── Schema ── */
const aadhaarSchema = z.object({
  // Stored without spaces; the field formats display as XXXX XXXX XXXX.
  aadhaar: aadhaarField(),
  fullName: personNameField({ label: "Name" }),
  /* Optional here as they are on the server — an application saved before this
     step asked for them must still be editable without suddenly failing on
     details it never held. */
  dateOfBirth: dateOfBirthField({ required: false, label: "Date of birth" }),
  gender: z.string().trim().optional(),
  address: z.string().trim().max(500, "Address must be under 500 characters.").optional(),
  aadhaarFrontImage: fileField({ message: "Please upload the front of your Aadhaar." }),
  aadhaarBackImage:  fileField({ message: "Please upload the back of your Aadhaar." }),
});

export default function AadhaarStep({ onNext, initialValues }) {
  const form = useForm({
    resolver: zodResolver(aadhaarSchema),
    defaultValues: {
      fullName: "", aadhaarFrontImage: undefined, aadhaarBackImage: undefined,
      ...initialValues,
      // Saved value is bare 12 digits — re-format for the spaced display field.
      // Covers the empty case too, which is why there is no earlier `aadhaar: ""`.
      aadhaar: formatAadhaar(initialValues?.aadhaar),
      // Optionals persist as null from the record — coerce to controlled strings.
      dateOfBirth: initialValues?.dateOfBirth ?? "",
      gender: initialValues?.gender ?? "",
      address: initialValues?.address ?? "",
    },
    mode: "onTouched",
  });

  /* Both Aadhaar images, fetched back from the record so an edit to a text
     field doesn't force the applicant to re-pick them. */
  const storedFiles = useDocumentFiles(
    {
      aadhaarFrontImage: initialValues?.aadhaarFrontImageKey,
      aadhaarBackImage: initialValues?.aadhaarBackImageKey,
    },
    { form }
  );

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
      onNext?.({ ...data, aadhaar: stripAadhaar(data.aadhaar) }); // pass clean 12 digits onward
    } catch (error) {
      reportFormError(form, error, "Couldn't save your Aadhaar details");
    }
  }, alertOnInvalid);

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-5 pb-4 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <Fingerprint size={13} strokeWidth={2.5} />
          Step 3 · Aadhaar Details
        </span>
        <h2 className="text-base sm:text-lg lg:text-[1.375rem] font-extrabold text-slate-800 tracking-tight">
          Add your Aadhaar card
        </h2>
        <p className="flex items-center gap-1.5 text-[0.625rem] sm:text-xs text-slate-500 mt-1 lg:mt-2">
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
          {...maskedField(form, "aadhaar", formatAadhaarInput)}
        />

        <Input
          id="fullName"
          label="Name (as per Aadhaar) *"
          placeholder="Your full name"
          maxLength={200}
          error={form.formState.errors.fullName?.message}
          {...form.register("fullName")}
        />

        <Input
          id="aadhaarDateOfBirth"
          label="Date of Birth"
          placeholder="dd/mm/yyyy"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          error={form.formState.errors.dateOfBirth?.message}
          {...maskedField(form, "dateOfBirth", formatDobInput)}
        />

        <Select
          id="gender"
          label="Gender"
          options={GENDERS}
          placeholder="Select gender"
          error={form.formState.errors.gender?.message}
          {...form.register("gender")}
        />

        <Input
          id="address"
          label="Address (as per Aadhaar)"
          placeholder="Address printed on the back of your Aadhaar"
          maxLength={500}
          error={form.formState.errors.address?.message}
          {...form.register("address")}
        />

        <Controller name="aadhaarFrontImage" control={form.control} render={({ field }) => (
          <FileUpload
            id="aadhaarFrontImage"
            label="Aadhaar Front"
            required
            initialFile={storedFiles.aadhaarFrontImage}
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
            initialFile={storedFiles.aadhaarBackImage}
            error={form.formState.errors.aadhaarBackImage?.message}
            hint="Back side showing your address."
            onChange={field.onChange}
          />
        )} />

        <div className="flex gap-3 pt-1">
          {/* Disabled while the upload is out — two images make this the longest
              round trip in the wizard, and the easiest to double-submit. */}
          <CustomButton
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1"
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
          </CustomButton>
        </div>
      </form>

    </div>
  );
}
