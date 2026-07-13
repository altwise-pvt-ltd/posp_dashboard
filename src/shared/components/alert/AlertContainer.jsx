import { AnimatePresence } from 'framer-motion';
import { useAlertStore } from '@/shared/store/alertStore';
import Alert from './Alert';

/**
 * The "stage". Mount this ONCE near the app root. It watches the store and
 * renders one <Alert> per active alert, stacked in the top-right corner.
 * AnimatePresence keeps each toast mounted long enough to play its exit.
 *
 * The wrapper is pointer-events-none so the empty corner never blocks clicks;
 * each Alert re-enables pointer events on itself.
 */
function AlertContainer() {
  const alerts = useAlertStore((state) => state.alerts);
  const dismissAlert = useAlertStore((state) => state.dismissAlert);

  return (
    <div className="pointer-events-none fixed top-4 right-4 left-4 sm:left-auto z-100 flex flex-col items-end gap-3 sm:w-full sm:max-w-sm">
      {/* Mobile: pinned to both edges (left-4 right-4) so a toast can't spill
          off-screen. From sm: up, release the left edge and become a fixed
          ~384px column anchored to the right. */}
      <AnimatePresence initial={false}>
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
            onClose={() => dismissAlert(alert.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default AlertContainer;
