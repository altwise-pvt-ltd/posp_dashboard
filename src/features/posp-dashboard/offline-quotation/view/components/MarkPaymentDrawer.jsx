import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/shared/components/Input';
import CustomButton from '@/shared/components/CustomButton';
import FileUpload from '@/shared/components/FileUpload';
import { fileField } from '@/shared/upload/schema';
import { alertOnInvalid } from '@/shared/store/alertStore';
import { reportFormError } from '@/shared/api/formErrors';
import QuoteDrawer from './QuoteDrawer';

/** Today as `YYYY-MM-DD` in local time, the format a date input uses. */
const localToday = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const markPaymentSchema = z.object({
  file: fileField({ message: 'Please upload the payment receipt.' }),
  amountClaimed: z
    .string()
    .trim()
    .min(1, 'Please enter the amount paid.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter the amount in rupees, e.g. 12000 or 12000.50.')
    .refine((value) => Number(value) > 0, 'Amount must be more than zero.'),
  referenceNo: z
    .string()
    .trim()
    .min(1, 'Please enter the transaction reference number.')
    .max(50, 'Reference number is too long.'),
  paidOn: z
    .string()
    .min(1, 'Please enter the payment date.')
    .refine((value) => value <= localToday(), "Payment date can't be in the future."),
  agentNote: z.string().trim().max(500, 'Keep the note under 500 characters.'),
});

const TEXTAREA =
  'w-full min-h-24 resize-y rounded-xl border bg-slate-50 px-3 py-2 text-[0.8125rem] text-slate-900 placeholder-slate-400 transition-all duration-200 hover:bg-slate-100/50 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 sm:px-3.5 sm:py-2.5 sm:text-sm';

/** Pre-filled with the instructed amount when the RM sent one. */
const amountDefault = (amount) => (Number.isFinite(amount) ? String(amount) : '');

function MarkPaymentForm({ amount, reference, onClose, onBack, onSubmit }) {
  const [today] = useState(localToday);

  const form = useForm({
    resolver: zodResolver(markPaymentSchema),
    defaultValues: {
      file: undefined,
      amountClaimed: amountDefault(amount),
      referenceNo: '',
      paidOn: '',
      agentNote: '',
    },
    mode: 'onTouched',
  });

  const { errors, isSubmitting } = form.formState;
  const noteLength = useWatch({ control: form.control, name: 'agentNote' })?.length ?? 0;

  const submit = form.handleSubmit(async (values) => {
    try {
      const done = await onSubmit?.(values);
      if (done) onClose();
    } catch (error) {
      reportFormError(form, error, "Couldn't submit the payment");
    }
  }, alertOnInvalid);

  return (
    <QuoteDrawer
      title="Mark payment"
      reference={reference}
      onClose={onClose}
      onBack={onBack}
      labelId="mark-payment-title"
      footer={
        <>
          <CustomButton variant="secondary" size="md" fullWidth onClick={onBack ?? onClose} disabled={isSubmitting}>
            Cancel
          </CustomButton>
          <CustomButton
            type="submit"
            form="mark-payment-form"
            variant="primary"
            size="md"
            fullWidth
            loading={isSubmitting}
          >
            {isSubmitting ? 'Submitting' : 'Submit payment'}
          </CustomButton>
        </>
      }
    >
      <form
        id="mark-payment-form"
        onSubmit={submit}
        noValidate
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-gutter"
      >
        <p className="font-body-md text-body-md mb-4 text-on-surface-variant">
          Add the receipt and transaction details once the payment is made. Your RM will verify it.
        </p>

        <Controller
          name="file"
          control={form.control}
          render={({ field }) => (
            <div className="mb-3">
              <FileUpload
                id="paymentReceipt"
                label="Payment receipt"
                required
                error={errors.file?.message}
                hint="A clear photo or screenshot of the payment confirmation."
                onChange={field.onChange}
              />
            </div>
          )}
        />

        <Input
          id="amountClaimed"
          label="Amount paid (₹) *"
          inputMode="decimal"
          placeholder="e.g. 12000"
          error={errors.amountClaimed?.message}
          {...form.register('amountClaimed')}
        />

        <Input
          id="referenceNo"
          label="Transaction reference no. *"
          placeholder="UTR / transaction ID"
          maxLength={50}
          autoComplete="off"
          error={errors.referenceNo?.message}
          {...form.register('referenceNo')}
        />

        <Input
          id="paidOn"
          type="date"
          label="Paid on *"
          max={today}
          error={errors.paidOn?.message}
          {...form.register('paidOn')}
        />

        <div>
          <label htmlFor="agentNote" className="mb-1 block text-[0.6875rem] font-semibold text-slate-700 sm:mb-1.25 sm:text-[0.8125rem]">
            Note for your RM
          </label>
          <textarea
            id="agentNote"
            rows={3}
            maxLength={500}
            placeholder="Anything the RM should know about this payment (optional)"
            aria-invalid={Boolean(errors.agentNote)}
            className={`${TEXTAREA} ${errors.agentNote ? 'border-red-400' : 'border-slate-200'}`}
            {...form.register('agentNote')}
          />
          <div className="mt-1 flex justify-between gap-2 text-[0.6875rem]">
            <span role="alert" className="font-medium text-red-500">
              {errors.agentNote?.message}
            </span>
            <span className="text-slate-400">{noteLength}/500</span>
          </div>
        </div>
      </form>
    </QuoteDrawer>
  );
}

/**
 * The agent's proof of payment against a payment instruction.
 * `onSubmit(values)` resolves true when the payment was recorded.
 */
function MarkPaymentDrawer({ open, amount, reference, onClose, onBack, onSubmit }) {
  return (
    <AnimatePresence>
      {open && (
        <MarkPaymentForm
          amount={amount}
          reference={reference}
          onClose={onClose}
          onBack={onBack}
          onSubmit={onSubmit}
        />
      )}
    </AnimatePresence>
  );
}

export default MarkPaymentDrawer;
