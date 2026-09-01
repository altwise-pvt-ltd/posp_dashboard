import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import FileUpload from "@/shared/components/FileUpload";
import { fileField } from "@/shared/upload/schema";
import { digitMask, maskedField } from "@/shared/validation/inputMask";
import { alertOnInvalid } from "@/shared/store/alertStore";
import { reportFormError } from "@/shared/api/formErrors";
import { useMasterOptions } from "../hooks/useMasterOptions";
import { useDocumentFiles } from "../hooks/useDocumentFiles";
import OptionsUnavailable from "../components/OptionsUnavailable";
import {
  fetchQualifications,
  matchMasterValue,
  saveEducationDetails,
} from "../api/onboardingApi";

/* ── Schema ──
 * Only HighestQualification is required; everything else is optional.
 * PassingYear stays a string in the form (text input) and is validated as a
 * 4-digit year in range; it's converted to a number on submit.
 */
const educationSchema = z.object({
  /**
   * A plain string, not an enum over a local list. The permitted values are
   * `GET /onboarding/masters/qualifications`' to name, and the literal union
   * that used to live here named three of the five wrong — `Graduate` and
   * `Professional` for `GRADUATE` and `PROFESSIONAL`, and `PostGraduate` for
   * `POST_GRADUATE`. The selector renders only server-supplied options, so this
   * rule exists to catch "nothing chosen".
   */
  highestQualification: z.string().min(1, "Select your highest qualification."),
  institutionName: z.string().trim().max(200, "Keep it under 200 characters.").optional(),
  boardOrUniversity: z.string().trim().max(200, "Keep it under 200 characters.").optional(),
  passingYear: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), "Enter a 4-digit year.")
    .refine(
      (v) => !v || (Number(v) >= 1950 && Number(v) <= 2100),
      "Year must be between 1950 and 2100."
    ),
  // Optional, but not unvalidated — an uploaded certificate has to satisfy the
  // same format and size rules as every other document.
  certificateImage: fileField({ required: false }),
});

export default function EducationStep({ onNext, initialValues }) {
  const form = useForm({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      // No pre-selection: unlike the bank step's Savings default, no
      // qualification is the obvious one, and a button the user never pressed
      // is a wrong answer waiting to be submitted.
      highestQualification: "",
      certificateImage: undefined,
      ...initialValues,
      // Optionals persist as undefined / number — coerce back to controlled
      // strings. These cover the empty case too, hence no earlier `""` pair.
      institutionName: initialValues?.institutionName ?? "",
      boardOrUniversity: initialValues?.boardOrUniversity ?? "",
      passingYear: initialValues?.passingYear != null ? String(initialValues.passingYear) : "",
    },
    mode: "onTouched",
  });

  /* The certificate already on file, so an edit to the qualification doesn't
     silently drop a document the applicant uploaded weeks ago. */
  const storedFiles = useDocumentFiles(
    { certificateImage: initialValues?.certificateImageKey },
    { form }
  );

  const {
    options: qualifications,
    loading,
    unavailable,
    reload,
  } = useMasterOptions(fetchQualifications);

  /**
   * Reconcile anything the form already holds against the fetched list.
   *
   * An edit arriving back from Review already holds a value; re-matching it
   * against the fetched list swaps it for the server's own spelling, so a value
   * stored under the old hardcoded names still lights the right button and
   * submits correctly. Nothing held → nothing selected.
   */
  useEffect(() => {
    if (!qualifications.length) return;
    const current = form.getValues("highestQualification");
    if (!current) return;
    form.setValue("highestQualification", matchMasterValue(current, qualifications) ?? "");
  }, [qualifications, form]);

  /**
   * Save, then advance — only on success.
   *
   * No `fallbackField`: four of the five fields are optional, so a rejection is
   * most likely about the qualification or the certificate, and guessing which
   * would mark an input the server never blamed.
   */
  const onSubmit = form.handleSubmit(async (data) => {
    const clean = {
      ...data,
      // Normalise empty optionals + coerce year to a number when present.
      institutionName: data.institutionName || undefined,
      boardOrUniversity: data.boardOrUniversity || undefined,
      passingYear: data.passingYear ? Number(data.passingYear) : undefined,
    };
    try {
      await saveEducationDetails(clean);
      onNext?.(clean);
    } catch (error) {
      reportFormError(form, error, "Couldn't save your education details");
    }
  }, alertOnInvalid);

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-5 pb-4 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <GraduationCap size={14} strokeWidth={2.5} />
          Step 6 · Education
        </span>
        <h2 className="text-base sm:text-lg lg:text-[1.375rem] font-extrabold text-slate-800 tracking-tight">
          Your education details
        </h2>
        <p className="flex items-center gap-1.5 text-[0.625rem] sm:text-xs text-slate-500 mt-1 lg:mt-2">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          Only your highest qualification is required — the rest is optional.
        </p>
      </div>

      <form onSubmit={onSubmit} className="px-4 sm:px-5 lg:px-6 py-5 flex flex-col gap-4 sm:gap-5">

        {/* ── Highest qualification selector ── */}
        <Controller
          name="highestQualification"
          control={form.control}
          render={({ field }) => (
            <div>
              <span className="block mb-2 text-sm font-semibold text-slate-700">
                Highest Qualification *
              </span>
              {unavailable ? (
                <OptionsUnavailable label="qualifications" onRetry={reload} />
              ) : loading ? (
                /* Placeholders rather than the old hardcoded list — three of
                   its five values were wrong, and rendering them would let the
                   user press a button about to be replaced. */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5" aria-busy="true">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {qualifications.map(({ value, label }) => {
                    const active = field.value === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        aria-pressed={active}
                        className={`rounded-xl border-2 py-2.5 px-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                          active
                            ? "border-orange-400 bg-orange-50 text-orange-600 shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-200 hover:bg-orange-50/40"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              {form.formState.errors.highestQualification && (
                <p className="mt-2 text-sm font-medium text-red-500" role="alert">
                  {form.formState.errors.highestQualification.message}
                </p>
              )}
            </div>
          )}
        />

        <Input
          id="institutionName"
          label="Institution Name"
          placeholder="School / college name (optional)"
          maxLength={200}
          error={form.formState.errors.institutionName?.message}
          {...form.register("institutionName")}
        />

        {/* Board / University + Passing year — paired on larger screens. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input
            id="boardOrUniversity"
            label="Board / University"
            placeholder="e.g. CBSE, Mumbai University"
            maxLength={200}
            error={form.formState.errors.boardOrUniversity?.message}
            {...form.register("boardOrUniversity")}
          />

          <Input
            id="passingYear"
            label="Passing Year"
            placeholder="e.g. 2018"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            className="font-mono tracking-wide"
            error={form.formState.errors.passingYear?.message}
            {...maskedField(form, "passingYear", digitMask(4))}
          />
        </div>

        <Controller name="certificateImage" control={form.control} render={({ field }) => (
          <FileUpload
            id="certificateImage"
            label="Certificate / Degree"
            initialFile={storedFiles.certificateImage}
            error={form.formState.errors.certificateImage?.message}
            hint="Optional — your highest degree or certificate."
            onChange={field.onChange}
          />
        )} />

        <div className="flex gap-3 pt-1">
          {/* Held closed until the options land, too: submitting before then
              would post an empty highestQualification the server requires. */}
          <Button
            type="submit"
            disabled={loading || unavailable || form.formState.isSubmitting}
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
