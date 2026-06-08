import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, ShieldCheck, Sparkles, Upload } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import FileUpload from "@/shared/components/FileUpload";
import { alertOnInvalid } from "@/shared/store/alertStore";

/* Parse a strict dd/mm/yyyy string → Date, or null if it isn't a real calendar date. */
const parseDob = (v) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v || "");
  if (!m) return null;
  const day = +m[1], month = +m[2], year = +m[3];
  const d = new Date(year, month - 1, day);
  // Reject rollovers like 31/02/2000 by checking the parts survived round-trip.
  const real = d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  return real ? d : null;
};

/* POSP applicants must be adults. True if `dob` was at least MIN_AGE years
   before today (compares against the same calendar day MIN_AGE years on). */
const MIN_AGE = 18;
const isOldEnough = (dob) => {
  const adultOn = new Date(dob.getFullYear() + MIN_AGE, dob.getMonth(), dob.getDate());
  return adultOn <= new Date();
};

/* ── Schema ── */
const panSchema = z.object({
  panNumber:    z.string().trim().length(10, "PAN must be 10 characters.").regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN — expected AAAAA1234A."),
  fullName:     z.string().trim().min(1, "Full name is required.").max(200),
  // DOB is optional; when present, parse once and check it's a real, past date
  // and that the applicant is at least 18 — distinct messages for each failure.
  dateOfBirth:  z.string().optional().superRefine((v, ctx) => {
    if (!v) return;
    const d = parseDob(v);
    if (!d || d > new Date()) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date as dd/mm/yyyy." });
      return;
    }
    if (!isOldEnough(d)) {
      ctx.addIssue({ code: "custom", message: `You must be at least ${MIN_AGE} years old.` });
    }
  }),
  panFrontImage: z.any().refine((f) => f instanceof File, "Please upload your PAN card image."),
});

const HOLDER_TYPE = {
  P: "Individual", C: "Company", H: "Hindu Undivided Family",
  F: "Firm / LLP", A: "Association of Persons", T: "Trust",
  B: "Body of Individuals", L: "Local Authority",
  J: "Artificial Juridical Person", G: "Government",
};

export default function PanStep({ onNext, initialValues }) {
  const form = useForm({
    resolver: zodResolver(panSchema),
    defaultValues: { panNumber: "", fullName: "", dateOfBirth: "", panFrontImage: undefined, ...initialValues },
    mode: "onTouched",
  });

  const pan = useWatch({ control: form.control, name: "panNumber" });
  const holderHint = pan?.length >= 4 ? HOLDER_TYPE[pan[3]] : null;

  const panField = form.register("panNumber");
  const handlePanChange = (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    panField.onChange(e);
  };

  // DOB → auto-insert slashes as the user types: dd/mm/yyyy
  const dobField = form.register("dateOfBirth");
  const handleDobChange = (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 8);
    e.target.value =
      d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
      : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}`
      : d;
    dobField.onChange(e);
  };

  const onSubmit = form.handleSubmit((data) => {
    onNext?.(data);
  }, alertOnInvalid);

  return (
    /* Card width scales up with the viewport: roomy on mobile, wider on each
       breakpoint so big screens fill space instead of capping at a small card. */
    <div className="w-full max-w-77.5 sm:max-w-90 lg:max-w-97.5 xl:max-w-97.5 mx-auto lg:mx-0 rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-4 pb-3 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <CreditCard size={12} strokeWidth={2} />
          Step 1 · PAN Verification
        </span>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight">
          Verify your PAN card
        </h2>
        <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1 lg:mt-2">
          <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
          Your data is encrypted and protected by Lets Insure.
        </p>
      </div>

      {/* ── PAN details + document ── */}
      <form onSubmit={onSubmit} className="px-4 sm:px-5 lg:px-6 py-4 flex flex-col gap-3.5 sm:gap-4">
        <div>
          <Input
            id="panNumber"
            label="PAN Number *"
            placeholder="ABCDE1234F"
            autoComplete="off"
            maxLength={10}
            error={form.formState.errors.panNumber?.message}
            className="font-mono uppercase tracking-widest text-sm sm:text-base"
            {...panField}
            onChange={handlePanChange}
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
          label="Full Name (as on PAN) *"
          placeholder="Your full name"
          maxLength={200}
          error={form.formState.errors.fullName?.message}
          {...form.register("fullName")}
        />

        <Input
          id="dateOfBirth"
          label="Date of Birth"
          placeholder="dd/mm/yyyy"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          error={form.formState.errors.dateOfBirth?.message}
          {...dobField}
          onChange={handleDobChange}
        />

        <Controller name="panFrontImage" control={form.control} render={({ field }) => (
          <FileUpload
            id="panFrontImage"
            label="PAN Card Image *"
            required
            accept="image/*,application/pdf"
            maxMB={10}
            error={form.formState.errors.panFrontImage?.message}
            hint="Make sure the photo is clear, flat, and well-lit."
            onChange={field.onChange}
          />
        )} />

        <div className="flex gap-3 pt-1">
          <Button type="submit" className="flex-1 flex items-center justify-center gap-2 lg:text-base">
            <Upload size={16} strokeWidth={2.5} /> Submit PAN
          </Button>
        </div>
      </form>

    </div>
  );
}