import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import Input from '@/shared/components/Input';
import CustomButton from '@/shared/components/CustomButton';
import FileUpload from '@/shared/components/FileUpload';
import { NAME_MAX_LENGTH } from '@/shared/validation/nameField';
import { digitMask, maskedField, upperAlnumMask } from '@/shared/validation/inputMask';
import { alertOnInvalid, showAlert } from '@/shared/store/alertStore';
import { reportFormError } from '@/shared/api/formErrors';
import { refreshPospProfile } from '@/shared/store/pospProfileStore';
import { useMasterOptions } from '@/features/onboarding/hooks/useMasterOptions';
import OptionsUnavailable from '@/features/onboarding/components/OptionsUnavailable';
import { bankSchema } from '@/features/onboarding/model/bankSchema';
import {
  fetchAccountTypes,
  matchMasterValue,
  saveBankDetails,
} from '@/features/onboarding/api/onboardingApi';

/* Only a full account number is prefilled; a masked one would fail validation. */
const fullAccountNumber = (value) => (/^[0-9]{9,18}$/.test(value ?? '') ? value : '');

function BankEditForm({ profile, onClose }) {
  const form = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      accountType: profile?.accountType ?? '',
      accountHolder: '',
      accountNumber: fullAccountNumber(profile?.accountNumber),
      confirmAccountNumber: '',
      ifsc: profile?.ifscCode ?? '',
      bankName: profile?.bankName ?? '',
      branchName: profile?.branchName ?? '',
      passbookImage: undefined,
      chequeImage: undefined,
    },
    mode: 'onTouched',
  });

  const { options: accountTypes, loading, unavailable, reload } = useMasterOptions(fetchAccountTypes);
  const { errors, isSubmitting } = form.formState;

  /* Keep the saved type if the server still offers it, else take the first. */
  useEffect(() => {
    if (!accountTypes.length) return;
    const current = form.getValues('accountType');
    form.setValue('accountType', matchMasterValue(current, accountTypes) ?? accountTypes[0].value);
  }, [accountTypes, form]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const onSubmit = form.handleSubmit(async (data) => {
    const clean = { ...data };
    delete clean.confirmAccountNumber;

    try {
      await saveBankDetails(clean);
      /* Re-read the record so the cards show what the server stored. */
      await refreshPospProfile();
      showAlert({ variant: 'success', title: 'Bank details updated' });
      onClose();
    } catch (error) {
      reportFormError(form, error, "Couldn't update your bank details");
    }
  }, alertOnInvalid);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit bank account"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 sm:p-4 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full sm:max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit bank account</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Payouts go to this account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
            <Input
              id="bankName"
              label="Bank Name *"
              placeholder="e.g. HDFC Bank"
              maxLength={NAME_MAX_LENGTH}
              error={errors.bankName?.message}
              {...form.register('bankName')}
            />

            <Controller
              name="accountType"
              control={form.control}
              render={({ field }) => (
                <div>
                  <span className="block mb-2 text-sm font-semibold text-slate-700">
                    Account Type *
                  </span>
                  {unavailable ? (
                    <OptionsUnavailable label="account types" onRetry={reload} />
                  ) : loading ? (
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
                                ? 'border-orange-400 bg-orange-50 text-orange-600 shadow-sm'
                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-200 hover:bg-orange-50/40'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {errors.accountType && (
                    <p className="mt-1.5 text-xs font-medium text-red-500" role="alert">
                      {errors.accountType.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Input
              id="accountHolder"
              label="Account Holder Name *"
              placeholder="Name as on the passbook"
              maxLength={NAME_MAX_LENGTH}
              error={errors.accountHolder?.message}
              {...form.register('accountHolder')}
            />

            <Input
              id="accountNumber"
              label="Account Number *"
              placeholder="Account number"
              inputMode="numeric"
              autoComplete="off"
              maxLength={18}
              className="font-mono tracking-wide"
              error={errors.accountNumber?.message}
              {...maskedField(form, 'accountNumber', digitMask(18))}
            />

            <Input
              id="confirmAccountNumber"
              label="Confirm Account Number *"
              placeholder="Re-enter to confirm"
              inputMode="numeric"
              autoComplete="off"
              maxLength={18}
              className="font-mono tracking-wide"
              error={errors.confirmAccountNumber?.message}
              {...maskedField(form, 'confirmAccountNumber', digitMask(18))}
            />

            <Input
              id="ifsc"
              label="IFSC Code *"
              placeholder="e.g. HDFC0001234"
              autoComplete="off"
              maxLength={11}
              className="font-mono tracking-[0.15em] uppercase"
              error={errors.ifsc?.message}
              {...maskedField(form, 'ifsc', upperAlnumMask(11))}
            />

            <Input
              id="branchName"
              label="Branch Name"
              placeholder="e.g. Shivaji Nagar"
              maxLength={NAME_MAX_LENGTH}
              error={errors.branchName?.message}
              {...form.register('branchName')}
            />

            <Controller
              name="passbookImage"
              control={form.control}
              render={({ field }) => (
                <FileUpload
                  id="passbookImage"
                  label="Passbook Photo"
                  required
                  error={errors.passbookImage?.message}
                  hint="First page showing your name, account number and IFSC."
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="chequeImage"
              control={form.control}
              render={({ field }) => (
                <FileUpload
                  id="chequeImage"
                  label="Cancelled Cheque"
                  required
                  error={errors.chequeImage?.message}
                  hint="A cheque with 'CANCELLED' written across it."
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.25 sm:py-2.75"
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              disabled={loading || unavailable || isSubmitting}
              className="flex-1 py-2.25 sm:py-2.75"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Portalled to body: the profile cards sit inside a transformed wrapper, which
   would clip a fixed overlay. The form mounts on open so it starts fresh. */
function BankEditDialog({ open, profile, onClose }) {
  if (!open) return null;
  return createPortal(<BankEditForm profile={profile} onClose={onClose} />, document.body);
}

export default BankEditDialog;
