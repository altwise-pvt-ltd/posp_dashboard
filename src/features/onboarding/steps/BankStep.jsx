import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Landmark, ShieldCheck, Upload } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import FileUpload from "@/shared/components/FileUpload";
import { alertOnInvalid } from "@/shared/store/alertStore";

/* ── Schema ── */
const bankSchema = z
  .object({
    accountType: z.enum(["savings", "current"], { required_error: "Choose an account type." }),
    accountHolder: z.string().trim().min(1, "Account holder name is required.").max(200),
    accountNumber: z.string().regex(/^[0-9]{9,18}$/, "Enter a valid account number (9–18 digits)."),
    confirmAccountNumber: z.string().min(1, "Please re-enter the account number."),
    // Real IFSC shape: 4 bank letters, a 0, then 6 branch alphanumerics.
    ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid 11-character IFSC code."),
    bankName: z.string().trim().min(1, "Bank name is required.").max(200),
    passbookImage: z.any().refine((f) => f instanceof File, "Please upload your passbook photo."),
    chequeImage: z.any().refine((f) => f instanceof File, "Please upload a cancelled cheque."),
  })
  .refine((d) => d.accountNumber === d.confirmAccountNumber, {
    path: ["confirmAccountNumber"],
    message: "Account numbers don't match.",
  });

/* Account-type options for the segmented selector (no icons). */
const ACCOUNT_TYPES = [
  { value: "savings", label: "Savings" },
  { value: "current", label: "Current" },
];

export default function BankStep({ onNext, initialValues }) {
  const form = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      accountType: "savings",
      accountHolder: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifsc: "",
      bankName: "",
      passbookImage: undefined,
      chequeImage: undefined,
      ...initialValues,
      // The confirm mirror isn't persisted — pre-satisfy it when editing.
      confirmAccountNumber: initialValues?.accountNumber ?? "",
    },
    mode: "onTouched",
  });

  // Account numbers → digits only.
  const digitsOnly = (field, max) => (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, max);
    field.onChange(e);
  };

  // IFSC → uppercase alphanumerics, max 11.
  const ifscField = form.register("ifsc");
  const handleIfscChange = (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    ifscField.onChange(e);
  };

  const acctField = form.register("accountNumber");
  const confirmField = form.register("confirmAccountNumber");

  const onSubmit = form.handleSubmit((data) => {
    const { confirmAccountNumber, ...clean } = data; // drop the confirm mirror
    onNext?.(clean);
  }, alertOnInvalid);

  return (
    <div className="w-full max-w-77.5 sm:max-w-90 lg:max-w-97.5 xl:max-w-97.5 mx-auto lg:mx-0 rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-5 pb-4 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <Landmark size={13} strokeWidth={2.5} />
          Step 5 · Bank Account
        </span>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight">
          Add your bank account
        </h2>
        <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1 lg:mt-2">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          Payouts go here. Your details are encrypted and never shared.
        </p>
      </div>

      <form onSubmit={onSubmit} className="px-4 sm:px-5 lg:px-6 py-5 flex flex-col gap-4 sm:gap-5">

        {/* Bank name — moved to top of the hierarchy. */}
        <Input
          id="bankName"
          label="Bank Name *"
          placeholder="e.g. HDFC Bank"
          maxLength={200}
          error={form.formState.errors.bankName?.message}
          {...form.register("bankName")}
        />

        {/* ── Account type selector (text-only) ── */}
        <Controller
          name="accountType"
          control={form.control}
          render={({ field }) => (
            <div>
              <span className="block mb-2 text-sm font-semibold text-slate-700">Account Type *</span>
              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map(({ value, label }) => {
                  const active = field.value === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      aria-pressed={active}
                      className={`flex items-center justify-center rounded-xl border-2 py-3 px-4 font-semibold transition-all duration-200 active:scale-[0.98] ${
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
            </div>
          )}
        />

        <Input
          id="accountHolder"
          label="Account Holder Name *"
          placeholder="Name as on the passbook"
          maxLength={200}
          error={form.formState.errors.accountHolder?.message}
          {...form.register("accountHolder")}
        />

        {/* Account number + confirm — side by side on larger screens, stacked on mobile. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input
            id="accountNumber"
            label="Account Number *"
            placeholder="Account number"
            inputMode="numeric"
            autoComplete="off"
            maxLength={18}
            className="font-mono tracking-wide"
            error={form.formState.errors.accountNumber?.message}
            {...acctField}
            onChange={digitsOnly(acctField, 18)}
          />

          <Input
            id="confirmAccountNumber"
            label="Confirm Account Number *"
            placeholder="Re-enter to confirm"
            inputMode="numeric"
            autoComplete="off"
            maxLength={18}
            onPaste={(e) => e.preventDefault()} /* force a manual re-type */
            className="font-mono tracking-wide"
            error={form.formState.errors.confirmAccountNumber?.message}
            {...confirmField}
            onChange={digitsOnly(confirmField, 18)}
          />
        </div>

        {/* IFSC — full width now that Bank Name lives at the top. */}
        <Input
          id="ifsc"
          label="IFSC Code *"
          placeholder="e.g. HDFC0001234"
          autoComplete="off"
          maxLength={11}
          className="font-mono tracking-[0.15em] uppercase"
          error={form.formState.errors.ifsc?.message}
          {...ifscField}
          onChange={handleIfscChange}
        />

        <Controller name="passbookImage" control={form.control} render={({ field }) => (
          <FileUpload
            id="passbookImage"
            label="Passbook Photo *"
            required
            accept="image/*,application/pdf"
            maxMB={10}
            error={form.formState.errors.passbookImage?.message}
            hint="First page showing your name, account number and IFSC."
            onChange={field.onChange}
          />
        )} />

        <Controller name="chequeImage" control={form.control} render={({ field }) => (
          <FileUpload
            id="chequeImage"
            label="Cancelled Cheque *"
            required
            accept="image/*,application/pdf"
            maxMB={10}
            error={form.formState.errors.chequeImage?.message}
            hint="A cheque with 'CANCELLED' written across it."
            onChange={field.onChange}
          />
        )} />

        <div className="flex gap-3 pt-1">
          <Button type="submit" className="flex-1 flex items-center justify-center gap-2">
            <Upload size={16} strokeWidth={2.5} /> Submit Bank Details
          </Button>
        </div>
      </form>

    </div>
  );
}