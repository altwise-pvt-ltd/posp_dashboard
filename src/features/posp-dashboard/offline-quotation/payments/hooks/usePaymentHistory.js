import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMyPayments } from '@/features/posp-dashboard/offline-quotation/api/paymentHistoryApi';
import { timeOf } from '@/features/posp-dashboard/offline-quotation/lib/normalize';

// All payments newest first, with search over quote number, proposal number and UTR.

export function usePaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let live = true;

    fetchMyPayments({ signal })
      .then((result) => {
        if (live) setPayments(result);
      })
      .catch((err) => {
        if (!live || signal.aborted) return;
        setError(err);
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [attempt]);

  // Loading starts true, so only a retry needs to reset it.
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  const sorted = useMemo(
    () => [...payments].sort((a, b) => timeOf(b.paidAt) - timeOf(a.paidAt)),
    [payments]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sorted;

    return sorted.filter((payment) =>
      [payment.quoteNumber, payment.proposalNumber, payment.utrNo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [sorted, query]);

  return {
    payments: sorted,
    visible,
    query,
    setQuery,
    filtered: sorted.length > 0 && visible.length === 0,
    loading,
    error,
    retry,
  };
}
