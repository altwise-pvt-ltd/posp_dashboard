import CustomButton from '@/shared/components/CustomButton';

/**
 * The action bar both card types put under their body: one full-width button,
 * and room beneath it for whatever that button has to say when it fails.
 *
 * Shared for the same reason `CardShell` draws the title itself — the two cards
 * were rendering an identical wrapper and an identically configured button, and
 * two places holding one piece of styling is two places for it to drift. What
 * differs between them is only wording, icon and what the failure looks like,
 * so that is all either card passes.
 *
 * Deliberately not opinionated about *state*. A banner runs a four-step machine
 * and a brochure a three-step one; this takes the one boolean it can actually
 * render — whether the button is busy — and leaves the rest where it belongs.
 */
function CardAction({ label, icon, busy = false, onClick, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <CustomButton
        variant="secondary"
        size="md"
        fullWidth
        loading={busy}
        leftIcon={icon}
        onClick={onClick}
      >
        {label}
      </CustomButton>

      {children}
    </div>
  );
}

export default CardAction;
