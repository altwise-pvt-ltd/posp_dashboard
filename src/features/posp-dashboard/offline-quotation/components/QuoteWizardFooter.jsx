import { ArrowLeft } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';

function QuoteWizardFooter({ message, invalid = false, onBack, children }) {
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
          <CustomButton variant="secondary" size="md" leftIcon={<ArrowLeft />} onClick={onBack}>
            Back
          </CustomButton>
        )}
        {children}
      </div>
    </div>
  );
}

export default QuoteWizardFooter;
