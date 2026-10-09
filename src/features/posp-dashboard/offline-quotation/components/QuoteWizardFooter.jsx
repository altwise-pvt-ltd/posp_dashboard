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
    <div className="flex flex-wrap items-center gap-unit border-t border-hairline pt-gutter">
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

      {/* Own row above the buttons on mobile, between them from md up */}
      <p
        role={tone === 'error' ? 'alert' : tone === 'success' ? 'status' : undefined}
        aria-live={tone === 'default' ? undefined : 'polite'}
        className={`font-body-md text-body-md order-first w-full min-w-0 md:order-0 md:w-auto md:flex-1 ${TONES[tone] ?? TONES.default}`}
      >
        {message}
      </p>

      {children && <div className="ml-auto flex items-center gap-unit">{children}</div>}
    </div>
  );
}

export default QuoteWizardFooter;
