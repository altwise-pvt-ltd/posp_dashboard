import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Landmark, Loader2, ShieldCheck, Upload } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import FileUpload from "@/shared/components/FileUpload";
import { fileField } from "@/shared/upload/schema";
import { alertOnInvalid } from "@/shared/store/alertStore";
import { reportFormError } from "@/shared/api/formErrors";
import { useMasterOptions } from "../hooks/useMasterOptions";
import OptionsUnavailable from "../components/OptionsUnavailable";
import {
  fetchAccountTypes,
  matchMasterValue,
  saveBankDetails,
} from "../api/onboardingApi";

/* ── Schema ── */
const bankSchema = z
  .object({
    /**
     * A plain string, not an enum. The permitted values come from
     * `GET /onboarding/masters/account-types` at runtime, so a literal union
     * here would be a second, staler copy of the same list — and the one that
     * silently rejects a value the server had just offered. The selector below
     * renders only server-supplied options, so the field cannot hold anything
     * else; this rule exists to catch "nothing chosen".
     */
    accountType: z.string().min(1, "Choose an account type."),
    accountHolder: z.string().trim().min(1, "Account holder name is required.").max(200),
    accountNumber: z.string().regex(/^[0-9]{9,18}$/, "Enter a valid account number (9–18 digits)."),
    confirmAccountNumber: z.string().min(1, "Please re-enter the account number."),
    // Real IFSC shape: 4 bank letters, a 0, then 6 branch alphanumerics.
    ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid 11-character IFSC code."),
    bankName: z.string().trim().min(1, "Bank name is required.").max(200),
    passbookImage: fileField({ message: "Please upload your passbook photo." }),
    chequeImage: fileField({ message: "Please upload a cancelled cheque." }),
  })
  .refine((d) => d.accountNumber === d.confirmAccountNumber, {
    path: ["confirmAccountNumber"],
    message: "Account numbers don't match.",
  });

export default function BankStep({ onNext, initialValues }) {
  const form = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      // Left blank rather than guessed at: the real options arrive from the
      // server a moment later, and a pre-selected button the user never pressed
      // is how a wrong account type gets submitted without anyone noticing.
      accountType: "",
      accountHolder: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
      passbookImage: undefined,
      chequeImage: undefined,
      ...initialValues,
      // The confirm mirror isn't persisted — pre-satisfy it when editing.
      // Covers the empty case too, hence no earlier `confirmAccountNumber: ""`.
      confirmAccountNumber: initialValues?.accountNumber ?? "",
    },
    mode: "onTouched",
  });

  const {
    options: accountTypes,
    loading,
    unavailable,
    reload,
  } = useMasterOptions(fetchAccountTypes);

  /**
   * Settle the selection once the options land.
   *
   * Keep whatever the form already holds if the server recognises it — an edit
   * arriving back from Review — and otherwise pre-select the first option,
   * which preserves the Savings-by-default this step has always shown. Either
   * way the stored value is now the server's own `value`, so what gets
   * submitted is `SAVINGS` rather than the rendered label.
   */
  useEffect(() => {
    if (!accountTypes.length) return;
    const current = form.getValues("accountType");
    form.setValue(
      "accountType",
      matchMasterValue(current, accountTypes) ?? accountTypes[0].value
    );
  }, [accountTypes, form]);

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

  /**
   * Save to the server, then advance — only on success.
   *
   * No `fallbackField`: a rejection could name the account number, the IFSC,
   * either image or the bank itself, and parking that under one input blames an
   * entry the user probably got right.
   */
  const onSubmit = form.handleSubmit(async (data) => {
    // The confirm mirror is a check on the user, not a fact about them, so it
    // goes no further than this line. (Deleted rather than left out of a rest
    // destructure, which lints as an unused binding under this config.)
    const clean = { ...data };
    delete clean.confirmAccountNumber;

    try {
      await saveBankDetails(clean);
      onNext?.(clean);
    } catch (error) {
      reportFormError(form, error, "Couldn't save your bank details");
    }
  }, alertOnInvalid);

  return (
    <div className="w-full max-w-89 sm:max-w-103.5 lg:max-w-112 xl:max-w-112 mx-auto lg:mx-0 rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

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
              {unavailable ? (
                <OptionsUnavailable label="account types" onRetry={reload} />
              ) : loading ? (
                /* Placeholders rather than the old hardcoded pair — the options
                   are the server's to name, and rendering a guess would let the
                   user press a button that is about to be replaced. */
                <div className="grid grid-cols-2 gap-3" aria-busy="true">
                  <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {accountTypes.map(({ value, label }) => {
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
              )}
              {form.formState.errors.accountType && (
                <p className="mt-1.5 text-xs font-medium text-red-500" role="alert">
                  {form.formState.errors.accountType.message}
                </p>
              )}
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
            label="Passbook Photo"
            required
            error={form.formState.errors.passbookImage?.message}
            hint="First page showing your name, account number and IFSC."
            onChange={field.onChange}
          />
        )} />

        <Controller name="chequeImage" control={form.control} render={({ field }) => (
          <FileUpload
            id="chequeImage"
            label="Cancelled Cheque"
            required
            error={form.formState.errors.chequeImage?.message}
            hint="A cheque with 'CANCELLED' written across it."
            onChange={field.onChange}
          />
        )} />

        <div className="flex gap-3 pt-1">
          {/* Held closed until the options land, too: submitting before then
              would post an empty accountType the server would reject. */}
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
                <Upload size={16} strokeWidth={2.5} /> Submit Bank Details
              </>
            )}
          </Button>
        </div>
      </form>

    </div>
  );
}