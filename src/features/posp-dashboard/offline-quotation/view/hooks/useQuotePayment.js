import { useEffect, useState } from 'react';
import { fetchMyPayments } from '@/features/posp-dashboard/offline-quotation/api/paymentHistoryApi';
import { timeOf } from '@/features/posp-dashboard/offline-quotation/lib/normalize';

/**
 * Finds the latest payment for this quote in the agent's payment history; null on failure.
 * ⚠ Reads every page of GET /quote/payments/my; a per-quote endpoint would be lighter.
 */
export function useQuotePayment(quoteId, quoteNumber, enabled) {
  const target = enabled && quoteId ? quoteId : null;

  const [payment, setPayment] = useState(null);
  const [shown, setShown] = useState(target);

  // Clear the previous quote's payment as soon as the target changes.
  if (shown !== target) {
    setShown(target);
    setPayment(null);
  }

  useEffect(() => {
    if (!target) return undefined;

    const controller = new AbortController();
    let live = true;

    fetchMyPayments({ signal: controller.signal })
      .then((payments) => {
        if (!live) return;

        const mine = payments
          .filter((p) => p.quoteId === target || (quoteNumber && p.quoteNumber === quoteNumber))
          .sort((a, b) => timeOf(b.paidAt) - timeOf(a.paidAt));

        setPayment(mine[0] ?? null);
      })
      .catch(() => {
        if (live) setPayment(null);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [target, quoteNumber]);

  return payment;
}
