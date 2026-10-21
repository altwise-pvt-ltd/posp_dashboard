import { Check, FileText } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';

const OUTLINE_SELECT =
  'hover:border-transparent hover:bg-linear-to-r hover:from-orange-500 hover:to-rose-500 hover:text-white disabled:hover:border-slate-200 disabled:hover:bg-none disabled:hover:text-slate-700';

/** "View quote" and "Select policy" for one response, or the "Selected" pill once chosen. */
function ResponseActions({
  response,
  quoteDocument,
  isBest,
  expired,
  onView,
  onSelect,
  selecting,
  busy,
}) {
  const { responseId, isSelected, quoteDocPath } = response;
  const selectable = Boolean(responseId) && Boolean(onSelect);

  return (
    <div className="flex gap-2 md:ml-auto">
      {quoteDocPath && (
        <CustomButton
          variant="ghost"
          size="md"
          leftIcon={<FileText />}
          className="flex-1 md:flex-none"
          disabled={!quoteDocument}
          title={quoteDocument ? undefined : 'The quote document is not available yet'}
          onClick={onView}
        >
          View quote
        </CustomButton>
      )}

      {isSelected ? (
        <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-white md:flex-none">
          <Check aria-hidden="true" className="size-4 shrink-0" />
          Selected
        </span>
      ) : (
        selectable && (
          <CustomButton
            variant={isBest ? 'primary' : 'secondary'}
            size="md"
            className={`flex-1 md:flex-none ${isBest ? '' : OUTLINE_SELECT}`}
            loading={selecting}
            // One selection in flight at a time; an expired quote cannot be chosen.
            disabled={expired || (busy && !selecting)}
            title={expired ? 'This quote has expired' : undefined}
            onClick={() => onSelect(responseId)}
          >
            {selecting ? 'Selecting' : 'Select policy'}
          </CustomButton>
        )
      )}
    </div>
  );
}

export default ResponseActions;
