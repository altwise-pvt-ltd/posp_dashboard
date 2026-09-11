import { ArrowLeft } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';

/**
 * `backLabel` exists because the button does not always mean "one step back".
 * On the first section of the form it leaves the form altogether and throws
 * every answer away, so it names its destination instead of a direction.
 *
 * `tone` colours the message and decides how it reaches a screen reader. Only
 * the two loud tones announce themselves: the quiet default is a running
 * commentary on the step ("6 questions in this section") that would be read out
 * on every move for no gain, while a failed save or a stored draft is news.
 */
const TONES = {
  default: 'text-on-surface-variant',
  error: 'text-red-500',
  success: 'text-emerald-600',
};

function QuoteWizardFooter({
  message,
  tone = 'default',
  onBack,
  backLabel = 'Back',
  backVariant = 'secondary',
  backDisabled = false,
  children,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-unit border-t border-gray-200 pt-gutter">
      <p
        role={tone === 'error' ? 'alert' : tone === 'success' ? 'status' : undefined}
        aria-live={tone === 'default' ? undefined : 'polite'}
        className={`font-body-md text-body-md min-w-0 ${TONES[tone] ?? TONES.default}`}
      >
        {message}
      </p>

      <div className="flex items-center gap-unit">
        {onBack && (
          <CustomButton
            variant={backVariant}
            size="md"
            leftIcon={<ArrowLeft />}
            disabled={backDisabled}
            onClick={onBack}
          >
            {backLabel}
          </CustomButton>
        )}
        {children}
      </div>
    </div>
  );
}

export default QuoteWizardFooter;
