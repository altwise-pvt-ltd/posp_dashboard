import { ArrowLeft } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';

// Only error and success messages are announced to screen readers.
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
  ref,
}) {
  return (
    <div
      ref={ref}
      className="flex flex-wrap items-center gap-unit border-t border-hairline pt-gutter"
    >
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
