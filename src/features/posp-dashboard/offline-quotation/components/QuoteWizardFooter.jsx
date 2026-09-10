import { ArrowLeft } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';

/**
 * `backLabel` exists because the button does not always mean "one step back".
 * On the first section of the form it leaves the form altogether and throws
 * every answer away, so it names its destination instead of a direction.
 */
function QuoteWizardFooter({
  message,
  invalid = false,
  onBack,
  backLabel = 'Back',
  backVariant = 'secondary',
  children,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-unit border-t border-gray-200 pt-gutter">
      <p
        className={`font-body-md text-body-md min-w-0 ${
          invalid ? 'text-red-500' : 'text-on-surface-variant'
        }`}
      >
        {message}
      </p>

      <div className="flex items-center gap-unit">
        {onBack && (
          <CustomButton variant={backVariant} size="md" leftIcon={<ArrowLeft />} onClick={onBack}>
            {backLabel}
          </CustomButton>
        )}
        {children}
      </div>
    </div>
  );
}

export default QuoteWizardFooter;
