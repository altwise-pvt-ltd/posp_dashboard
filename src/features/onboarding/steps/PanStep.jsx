import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import Input from "@/shared/components/Input";
import CustomButton from "@/shared/components/CustomButton";
import FileUpload from "@/shared/components/FileUpload";
import { fileField } from "@/shared/upload/schema";
import { personNameField } from "@/shared/validation/nameField";
import {
  dateOfBirthField,
  formatDobInput,
} from "@/shared/validation/dateOfBirthField";
import { maskedField, upperAlnumMask } from "@/shared/validation/inputMask";
import { alertOnInvalid } from "@/shared/store/alertStore";
import { reportFormError } from "@/shared/api/formErrors";
import { submitPanDetails } from "../api/onboardingApi";
import { useDocumentFiles } from "../hooks/useDocumentFiles";

/* ── Schema ── */
const panSchema = z.object({
  panNumber: z
    .string()
    .trim()
    .length(10, "PAN must be 10 characters.")
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN — expected AAAAA1234A."),
  fullName: personNameField({ label: "Full name" }),
  /* Required in the form, though `POST /onboarding/pan/save` lists only
     `panNumber` and `fullName` as required. The stricter rule is deliberate: a
     PAN with no date of birth against it cannot be matched during KYC, and the
     asterisk on the label is only honest if the schema enforces it. */
  dateOfBirth: dateOfBirthField({ required: true, label: "Date of birth" }),
  panFrontImage: fileField({
    message: "Please upload a photo of your PAN card.",
  }),
});

const HOLDER_TYPE = {
  P: "Individual",
  C: "Company",
  H: "Hindu Undivided Family",
  F: "Firm / LLP",
  A: "Association of Persons",
  T: "Trust",
  B: "Body of Individuals",
  L: "Local Authority",
  J: "Artificial Juridical Person",
  G: "Government",
};

export default function PanStep({ onNext, initialValues }) {
  const form = useForm({
    resolver: zodResolver(panSchema),
    defaultValues: {
      panNumber: "",
      fullName: "",
      dateOfBirth: "",
      panFrontImage: undefined,
      ...initialValues,
    },
    mode: "onTouched",
  });

  /* Documents already on file, fetched back as `File`s so an edit that changes
     only a text field doesn't force the applicant to re-pick the card photo. */
  const storedFiles = useDocumentFiles(
    { panFrontImage: initialValues?.panFrontImageKey },
    { form },
  );

  const pan = useWatch({ control: form.control, name: "panNumber" });
  const holderHint = pan?.length >= 4 ? HOLDER_TYPE[pan[3]] : null;

  /**
   * Save to the server, then advance — in that order, and only on success.
   *
   * `onNext` is what ticks the stepper and moves the wizard on, so calling it
   * before the server has accepted the details would march the user forward
   * over a step that didn't save. Awaiting inside `handleSubmit` is also what
   * keeps `isSubmitting` true for the whole round trip, which the button reads.
   *
   * No `fallbackField` on the error: a rejection here could be about the PAN,
   * the name, the date or the image, and parking a generic message under the
   * PAN box would blame the one input the user is most likely to have typed
   * correctly. The toast carries it instead, and a server that names a field
   * still gets it placed exactly.
   */
  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await submitPanDetails(data);
      onNext?.(data);
    } catch (error) {
      reportFormError(form, error, "Couldn't save your PAN details");
    }
  }, alertOnInvalid);

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">
      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-4 pb-3 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <CreditCard size={12} strokeWidth={2} />
          Step 1 · PAN Verification
        </span>
        <h2 className="text-base sm:text-lg lg:text-[1.375rem] font-extrabold text-slate-800 tracking-tight">
          Verify your PAN card
        </h2>
        <p className="flex items-center gap-1.5 text-[0.625rem] sm:text-xs text-slate-500 mt-1 lg:mt-2">
          <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
          Your data is encrypted and protected by Lets Insurance.
        </p>
      </div>

      {/* ── PAN details + document ── */}
      <form
        onSubmit={onSubmit}
        className="px-4 sm:px-5 lg:px-6 py-4 flex flex-col gap-3.5 sm:gap-4"
      >
        <div>
          <Input
            id="panNumber"
            label="PAN Number *"
            placeholder="ABCDE1234F"
            autoComplete="off"
            maxLength={10}
            error={form.formState.errors.panNumber?.message}
            className="font-mono uppercase tracking-widest text-sm sm:text-base"
            {...maskedField(form, "panNumber", upperAlnumMask(10))}
          />
          {!form.formState.errors.panNumber && holderHint && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 -mt-3">
              <Sparkles size={10} className="text-orange-400" />
              Detected: <strong className="text-slate-700">{holderHint}</strong>
            </span>
          )}
        </div>

        <Input
          id="fullName"
          label="Full Name (as per PAN) *"
          placeholder="Your full name"
          maxLength={200}
          error={form.formState.errors.fullName?.message}
          {...form.register("fullName")}
        />

        <Input
          id="dateOfBirth"
          label="Date of Birth *"
          placeholder="dd/mm/yyyy"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          error={form.formState.errors.dateOfBirth?.message}
          {...maskedField(form, "dateOfBirth", formatDobInput)}
        />

        <Controller
          name="panFrontImage"
          control={form.control}
          render={({ field }) => (
            <FileUpload
              id="panFrontImage"
              label="PAN Card"
              required
              initialFile={storedFiles.panFrontImage}
              error={form.formState.errors.panFrontImage?.message}
              hint="Make sure the photo is clear, flat, and well-lit."
              onChange={field.onChange}
            />
          )}
        />

        <div className="flex gap-3 pt-1">
          {/* Disabled while the upload is out — the image makes this the first
              step with a round trip long enough to double-submit by accident. */}
          <CustomButton
            type="submit"
            disabled={form.formState.isSubmitting}
            className="flex-1 lg:text-sm"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Upload size={16} strokeWidth={2.5} /> Submit PAN
              </>
            )}
          </CustomButton>
        </div>
      </form>
    </div>
  );
}
