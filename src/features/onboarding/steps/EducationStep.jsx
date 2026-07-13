import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import FileUpload from "@/shared/components/FileUpload";
import { alertOnInvalid } from "@/shared/store/alertStore";

/* ── Schema ──
 * Only HighestQualification is required; everything else is optional.
 * PassingYear stays a string in the form (text input) and is validated as a
 * 4-digit year in range; it's converted to a number on submit.
 */
const QUALIFICATIONS = [
  "SSC",
  "HSC",
  "Graduate",
  "PostGraduate",
  "Professional",
];

const educationSchema = z.object({
  highestQualification: z.enum(QUALIFICATIONS, {
    required_error: "Select your highest qualification.",
  }),
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
  certificateImage: z.any().optional(),
});

/* Friendly labels for the segmented selector — values stay as the enum keys. */
const QUALIFICATION_OPTIONS = [
  { value: "SSC", label: "SSC" },
  { value: "HSC", label: "HSC" },
  { value: "Graduate", label: "Graduate" },
  { value: "PostGraduate", label: "Post Graduate" },
  { value: "Professional", label: "Professional" },
];

export default function EducationStep({ onNext, initialValues }) {
  const form = useForm({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      highestQualification: undefined,
      institutionName: "",
      boardOrUniversity: "",
      passingYear: "",
      certificateImage: undefined,
      ...initialValues,
      // Optionals persist as undefined / number — coerce back to controlled strings.
      institutionName: initialValues?.institutionName ?? "",
      boardOrUniversity: initialValues?.boardOrUniversity ?? "",
      passingYear: initialValues?.passingYear != null ? String(initialValues.passingYear) : "",
    },
    mode: "onTouched",
  });

  // Passing year → digits only, max 4.
  const yearField = form.register("passingYear");
  const handleYearChange = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    yearField.onChange(e);
  };

  const onSubmit = form.handleSubmit((data) => {
    const clean = {
      ...data,
      // Normalise empty optionals + coerce year to a number when present.
      institutionName: data.institutionName || undefined,
      boardOrUniversity: data.boardOrUniversity || undefined,
      passingYear: data.passingYear ? Number(data.passingYear) : undefined,
    };
    onNext?.(clean);
  }, alertOnInvalid);

  return (
    <div className="w-full max-w-[310px] sm:max-w-[360px] lg:max-w-[390px] xl:max-w-[390px] mx-auto lg:mx-0 rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-5 pb-4 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <GraduationCap size={14} strokeWidth={2.5} />
          Step 6 · Education
        </span>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight">
          Your education details
        </h2>
        <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1 lg:mt-2">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {QUALIFICATION_OPTIONS.map(({ value, label }) => {
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
            {...yearField}
            onChange={handleYearChange}
          />
        </div>

        <Controller name="certificateImage" control={form.control} render={({ field }) => (
          <FileUpload
            id="certificateImage"
            label="Certificate / Degree"
            accept="image/*,application/pdf"
            maxMB={10}
            error={form.formState.errors.certificateImage?.message}
            hint="Optional — your highest degree or certificate."
            onChange={field.onChange}
          />
        )} />

        <div className="flex gap-3 pt-1">
          <Button type="submit" className="flex-1 flex items-center justify-center gap-2">
            Continue <ArrowRight size={16} strokeWidth={2.5} />
          </Button>
        </div>
      </form>

    </div>
  );
}
