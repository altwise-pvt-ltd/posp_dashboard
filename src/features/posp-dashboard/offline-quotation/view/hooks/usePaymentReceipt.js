import { useCallback } from 'react';
import { showAlert } from '@/shared/store/alertStore';
import { submitPaymentReceipt } from '../api/paymentInstructionApi';

// Sends a payment receipt for the quote, shows a success alert, then calls onSubmitted.
// Errors propagate so the form can show them on its fields.
export function usePaymentReceipt(quoteId, onSubmitted) {
  return useCallback(
    async (values) => {
      const { message } = await submitPaymentReceipt(quoteId, values);

      showAlert({
        variant: 'success',
        title: 'Payment submitted',
        message: message || 'Your RM will verify the payment receipt.',
      });

      onSubmitted?.();
      return true;
    },
    [quoteId, onSubmitted]
  );
}
