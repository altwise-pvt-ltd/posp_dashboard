import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ban } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import { alertOnInvalid, showAlert } from '@/shared/store/alertStore';
import { reportFormError } from '@/shared/api/formErrors';
import { requestPolicyCancellation } from '../api/policyApi';

const REASON_MAX = 500;

const cancellationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Please enter the reason for cancellation.')
    .max(REASON_MAX, `Keep the reason under ${REASON_MAX} characters.`),
});

const TEXTAREA =
  'w-full min-h-24 resize-y rounded-xl border bg-slate-50 px-3 py-2 text-[0.8125rem] text-slate-900 placeholder-slate-400 transition-all duration-200 hover:bg-slate-100/50 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 sm:px-3.5 sm:py-2.5 sm:text-sm';

function CancellationForm({ policyId, onDone, onCancel }) {
  const form = useForm({
    resolver: zodResolver(cancellationSchema),
    defaultValues: { reason: '' },
    mode: 'onTouched',
  });

  const { errors, isSubmitting } = form.formState;
  const reasonLength = useWatch({ control: form.control, name: 'reason' })?.length ?? 0;

  const submit = form.handleSubmit(async ({ reason }) => {
    try {
      const { message } = await requestPolicyCancellation(policyId, reason);
      showAlert({
        variant: 'success',
        title: 'Cancellation requested',
        message: message || 'Your cancellation request has been sent.',
      });
      onDone();
    } catch (error) {
      reportFormError(form, error, "Couldn't request cancellation", 'reason');
    }
  }, alertOnInvalid);

  return (
    <form onSubmit={submit} noValidate>
      <label
        htmlFor="cancellationReason"
        className="mb-1 block text-[0.6875rem] font-semibold text-slate-700 sm:mb-1.25 sm:text-[0.8125rem]"
      >
        Reason for cancellation *
      </label>
      <textarea
        id="cancellationReason"
        rows={3}
        maxLength={REASON_MAX}
        placeholder="e.g. Customer has sold the vehicle."
        aria-invalid={Boolean(errors.reason)}
        className={`${TEXTAREA} ${errors.reason ? 'border-red-400' : 'border-slate-200'}`}
        {...form.register('reason')}
      />
      <div className="mt-1 flex justify-between gap-2 text-[0.6875rem]">
        <span role="alert" className="font-medium text-red-500">
          {errors.reason?.message}
        </span>
        <span className="text-slate-400">
          {reasonLength}/{REASON_MAX}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <CustomButton variant="secondary" size="md" fullWidth onClick={onCancel} disabled={isSubmitting}>
          Back
        </CustomButton>
        <CustomButton type="submit" variant="danger" size="md" fullWidth loading={isSubmitting}>
          {isSubmitting ? 'Submitting' : 'Request cancellation'}
        </CustomButton>
      </div>
    </form>
  );
}

/** "Policy cancellation" button that opens a reason form in place. */
function PolicyCancellation({ policyId, onRequested }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <CustomButton variant="secondary" size="md" fullWidth onClick={() => setOpen(true)}>
        <Ban aria-hidden="true" />
        Policy cancellation
      </CustomButton>
    );
  }

  return (
    <CancellationForm
      policyId={policyId}
      onCancel={() => setOpen(false)}
      onDone={() => {
        setOpen(false);
        onRequested?.();
      }}
    />
  );
}

export default PolicyCancellation;
