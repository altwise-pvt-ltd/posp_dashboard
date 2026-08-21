import { showAlert } from "@/shared/store/alertStore";

/**
 * Put a server-side failure where the user can act on it — in both places.
 *
 * The field message is the record: it sits under the input they are about to
 * retype and stays there until they change it. The toast is the announcement —
 * it reaches someone whose eyes are on the keypad, or who has just come back
 * from another app, which a line of small red text under a field does not.
 *
 * Lifted out of LoginForm when the PAN step needed the identical thing. Six
 * more steps are queued behind it, and a per-step copy is how "the server named
 * a field" quietly stops working on five of them.
 *
 * `fallbackField` covers a backend that rejects a value without naming a field
 * — as this one does, sending only `errors: ['Invalid OTP. 3 attempt(s)
 * remaining.']`. When the message plainly concerns one input, naming it saves
 * the user working out which is at fault. Omit it when the failure could belong
 * to any field on the form: a message parked under the wrong input is worse
 * than one that stays in the toast.
 *
 * @param form           react-hook-form instance
 * @param error          an ApiError (see `shared/api/ApiError`)
 * @param title          toast heading, e.g. "Couldn't save your PAN details"
 * @param fallbackField  field to blame when the server named none
 */
export function reportFormError(form, error, title, fallbackField) {
  // Only fields this form actually holds. A server that names something the
  // form has no input for would otherwise leave react-hook-form with an error
  // on a key nothing renders — permanently invalid, with nothing on screen to
  // explain why.
  const known = Object.keys(form.getValues());
  const named = Object.entries(error.fieldErrors ?? {}).filter(([field]) =>
    known.includes(field)
  );

  if (named.length) {
    named.forEach(([field, message]) =>
      form.setError(field, { type: "server", message })
    );
  } else if (fallbackField && error.isValidation) {
    form.setError(fallbackField, { type: "server", message: error.message });
  }

  showAlert({
    /**
     * A rejected payload is a warning, not an error, and the difference is
     * how long it stays up: `warning` clears itself after five seconds,
     * `error` sits there until it is dismissed (see `alertLegend`). "Invalid
     * OTP. 3 attempt(s) remaining." is out of date the moment they start
     * retyping, so it must not outlive the attempt — a stale attempt count is
     * worse than none. A network or server failure, which no amount of typing
     * fixes, is worth leaving on screen.
     *
     * It also matches `alertOnInvalid`, so a value the client rejects for its
     * shape and one the server rejects for being wrong look alike.
     */
    variant: error.isValidation ? "warning" : "error",
    title,
    /**
     * When the server named fields, its top-level message is usually the
     * generic envelope line — the text worth repeating is the one now sitting
     * under the input.
     */
    message: named.length
      ? named.map(([, message]) => message).join(" ")
      : error.message,
  });
}
