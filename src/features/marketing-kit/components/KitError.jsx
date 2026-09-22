import { RefreshCw, TriangleAlert } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import KitNotice from './KitNotice';

/**
 * A failed request, with the way out of it.
 *
 * Both halves of `KitSection` fail the same way — the category list and the
 * items inside one — and they were the same nine lines twice. The only thing
 * that differs is which sentence to fall back on when the server sent none.
 */
function KitError({ error, fallback, onRetry }) {
  return (
    <KitNotice>
      <TriangleAlert aria-hidden="true" className="size-6 text-error" />
      <p>{error?.message || fallback}</p>
      <CustomButton variant="secondary" size="md" leftIcon={<RefreshCw />} onClick={onRetry}>
        Try again
      </CustomButton>
    </KitNotice>
  );
}

export default KitError;
