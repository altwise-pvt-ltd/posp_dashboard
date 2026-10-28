import { AnimatePresence, motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import CustomButton from '@/shared/components/CustomButton';
import { BUTTON_OUT, CHECK_DRAW, PILL_IN, SHINE } from '../lib/responseMotion';

/** Check mark whose stroke draws in. */
function DrawnCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <motion.path d="M20 6 9 17l-5-5" {...CHECK_DRAW} />
    </svg>
  );
}

/** "View quote document" and "Select policy" for one response, or the "Selected" pill once chosen. */
function ResponseActions({
  response,
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
          onClick={onView}
        >
          View quote document
        </CustomButton>
      )}

      {/* Skips the entrance on first render so only a fresh selection animates. */}
      <AnimatePresence mode="wait" initial={false}>
        {isSelected ? (
          <motion.span
            key="selected"
            {...PILL_IN}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-brand/30 md:flex-none"
          >
            <DrawnCheck />
            Selected
          </motion.span>
        ) : (
          selectable && (
            <motion.div key="select" {...BUTTON_OUT} className="flex flex-1 md:flex-none">
              <CustomButton
                variant="primary"
                size="md"
                className={`flex-1 ${SHINE}`}
                loading={selecting}
                // One selection in flight at a time; an expired quote cannot be chosen.
                disabled={expired || (busy && !selecting)}
                title={expired ? 'This quote has expired' : undefined}
                onClick={() => onSelect(responseId)}
              >
                {selecting ? 'Selecting' : 'Select policy'}
              </CustomButton>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

export default ResponseActions;
