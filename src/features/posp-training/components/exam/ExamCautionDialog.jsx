import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Loader2, ShieldAlert } from 'lucide-react';

/**
 * The last stop before the exam opens.
 *
 * `POST /lms/complete-training` has already answered by the time this shows —
 * the hours are settled and the record is closed. What is still reversible is
 * the sitting itself, and that is the one thing worth a stop: the attempt lives
 * entirely in `ExamPortal`'s state, so a closed tab, a refresh or a back
 * navigation takes the answers with it. There is no resume. Whoever comes back
 * starts the paper again from question one.
 *
 * A POSP cannot be told that *inside* the exam, because by then the warning is
 * about something they have already done. It has to be said while leaving is
 * still free, which is here.
 *
 * Built on `TrainingCompleteCard`'s frame on purpose — the same label-and-icon
 * head, the same title weight, the same slate block, the same footnote. It is
 * the panel the POSP just pressed, so it should read as that panel continuing
 * rather than as a system alert interrupting it.
 *
 * Orange rather than amber or red. The palette is orange and slate; a caution
 * colour introduced for one dialog is a fourth accent nothing else in the
 * programme speaks, and at this size the difference between amber and orange is
 * a shade nobody reads as a severity. The glyph and the copy carry the warning.
 *
 * Two rules in one block, not two cards. They are one condition being stated —
 * finish it, or start it again — and separate surfaces would read as unrelated
 * notices, the same reason `ExamInstructions` keeps its guidelines together.
 *
 * Deliberately not a checkbox gate. This is one fact stated once, not a consent
 * being collected — the two consents this programme does collect are stamped on
 * the server by `accept-terms` and `accept-training-norms`, and dressing a
 * caution up as a third would imply a record that is not being kept.
 *
 * Cancelling costs nothing and is not a dead end: the record now reads
 * `hoursComplete`, so pressing "Start exam" again short-circuits straight back
 * here without touching the network.
 *
 * Focus lands on "Not yet" and Escape closes, the same way `SubmitSectionDialog`
 * does it — the safe option is the one a keyboard reaches first, and on this
 * screen the safe option is the one that does *not* start an unrecoverable
 * attempt.
 *
 * `starting` is `POST /exam/start` in flight — the press opens the attempt on
 * the server, so the dialog stays put and reports rather than handing over to a
 * screen that may have no paper to show. Every way out is sealed while it runs,
 * Escape and the backdrop included: an attempt is being stamped, and a dialog
 * dismissed mid-flight would leave the POSP on the training page with a sitting
 * already spent against them.
 *
 * `error` is that call having failed. It lands under the buttons rather than
 * replacing the warning, because the warning is still true and the press is
 * still worth retrying — nothing about the caution has changed.
 */
function ExamCautionDialog({ open, starting = false, error = null, onCancel, onContinue }) {
  const cancelButtonRef = useRef(null);

  /* Focus on opening only. Kept apart from the key handler below so that the
     request going in and out of flight — which the handler has to know about —
     does not re-run this and pull focus back out of wherever it has moved to. */
  useEffect(() => {
    if (open) cancelButtonRef.current?.focus();
  }, [open]);

  /**
   * Hold the page still underneath.
   *
   * A desktop pointer stays on the card; a thumb does not. Without this, a drag
   * anywhere on the backdrop scrolls the training page behind the dialog, and
   * the POSP lets go somewhere else entirely — the syllabus has moved, the card
   * has not, and closing the caution lands them nowhere near where they pressed.
   * The overlay does its own scrolling, so nothing is trapped by this.
   *
   * The previous value is restored rather than cleared, so this cannot quietly
   * take ownership of a scroll lock something else set.
   */
  useEffect(() => {
    if (!open) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !starting) onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, starting, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        /* The overlay scrolls; the card is only ever as tall as its content.

           Centring alone is a desktop assumption: `items-center` on a fixed box
           with no overflow puts a card taller than the viewport half above the
           top edge and half below it, clipped at both, with the buttons out of
           reach and no way to scroll to them. That is any small phone in
           landscape, and an ordinary one once the error line appears under a
           failed press.

           `min-h-full items-center` inside a scrolling parent keeps both
           readings: a short card is centred exactly as before, a tall one is
           scrolled from its own top with every part of it reachable. */
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-900/40 backdrop-blur-sm"
          onClick={starting ? undefined : onCancel}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="exam-caution-title"
              aria-describedby="exam-caution-body"
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] sm:p-7"
            >
              {/* The same head `TrainingCompleteCard` wears: the label says where
                  you are, the tile is punctuation rather than the message. */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Before you begin
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                  <ShieldAlert className="size-4" strokeWidth={2.25} aria-hidden="true" />
                </span>
              </div>

              <h2
                id="exam-caution-title"
                className="mt-4 text-base font-extrabold leading-6 tracking-tight text-slate-900 sm:mt-5 sm:text-lg sm:leading-7"
              >
                Once you begin, you must finish
              </h2>
              <p id="exam-caution-body" className="mt-2 text-sm leading-6 text-slate-500">
                The certification exam is a single sitting. Set aside the time before you continue.
              </p>

              {/* One surface, two rules. Dots rather than icons — at this size an
                  icon per line is decoration competing with the sentence it sits
                  beside. */}
              <ul className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3.5 sm:mt-5 sm:p-4">
                <li className="flex gap-2.5 sm:gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[0.4375rem] size-1.5 shrink-0 rounded-full bg-orange-500"
                  />
                  <p className="text-sm leading-6 text-slate-600">
                    The exam must be completed and{' '}
                    <span className="font-semibold text-slate-800">submitted in one go</span>. The
                    timer runs continuously and cannot be paused.
                  </p>
                </li>

                <li className="flex gap-2.5 sm:gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[0.4375rem] size-1.5 shrink-0 rounded-full bg-orange-500"
                  />
                  <p className="text-sm leading-6 text-slate-600">
                    If you close or refresh this page before submitting, the attempt is lost and{' '}
                    <span className="font-semibold text-slate-800">
                      you will have to retake the exam from the start
                    </span>
                    .
                  </p>
                </li>
              </ul>

              {/* Cancel first, confirm second — the order `SubmitSectionDialog`
                  uses, and the order the eye finishes on the action it came for.
                  Stacked on a phone, which lands the same order somewhere useful:
                  the primary ends up at the foot of the card, nearest the thumb,
                  and the way out sits above it rather than under it where it
                  would be pressed by accident. `whitespace-nowrap` because a
                  wrapped primary label is what made these two different heights. */}
              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row">
                <button
                  type="button"
                  ref={cancelButtonRef}
                  onClick={onCancel}
                  disabled={starting}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-600"
                >
                  Not yet
                </button>

                {/* The press that spends the attempt, so it must not be pressable
                    twice — `/exam/start` counts sittings and would open a second
                    one. The label changes with it: "Continue" is a door, and while
                    the server is stamping the attempt the door is not open yet. */}
                <button
                  type="button"
                  onClick={onContinue}
                  disabled={starting}
                  aria-busy={starting}
                  className="group inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-orange-700/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-orange-600 disabled:active:scale-100"
                >
                  {starting ? 'Opening exam…' : 'Continue to exam'}
                  {starting ? (
                    <Loader2
                      className="size-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>

              {/* The call failing, said where the press was made. Below the
                  buttons rather than in place of the warning above them — the
                  warning still stands and the press is still worth retrying. */}
              {error && (
                <p role="alert" className="mt-3 text-center text-xs leading-5 text-rose-600">
                  {error.message ?? "Couldn't open the exam. Please try again."}
                </p>
              )}

              {/* Says the quiet part out loud, so backing out doesn't read as
                  forfeiting the exam. */}
              <p className="mt-3 text-center text-xs leading-5 text-slate-400 sm:text-[0.6875rem] sm:leading-4">
                Your hours are already recorded — you can sit the exam whenever you're ready.
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ExamCautionDialog;
