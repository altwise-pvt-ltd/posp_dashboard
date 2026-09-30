import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import Input from "./Input";
import { maskedField } from "@/shared/validation/inputMask";
import { formatDobInput, MIN_AGE } from "@/shared/validation/dateOfBirthField";

/* The native date input speaks `yyyy-mm-dd`; the form, its validator and the
   API layer all speak `dd/mm/yyyy`. These two are the only crossing point. */
const toIso = (dmy) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dmy || "");
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
};

const fromIso = (iso) => {
  const [year, month, day] = String(iso).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
};

/* Latest birthday that is already MIN_AGE today, in local time — built from
   parts rather than toISOString(), which would shift it across UTC. */
function latestAdultBirthday() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear() - MIN_AGE}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Date-of-birth field: the typed `dd/mm/yyyy` mask stays the primary input,
 * and the calendar icon opens the browser's own picker as a second way in.
 *
 * The picker is a visually hidden `<input type="date">` that only ever writes
 * back through `setValue`, so the form still holds one `dd/mm/yyyy` string and
 * `dateOfBirthField` stays the single judge of what is valid.
 */
function DobInput({ form, name, ...props }) {
  const pickerRef = useRef(null);

  const openPicker = () => {
    const picker = pickerRef.current;
    if (!picker) return;
    // Open on the date already typed, when there is a whole one.
    picker.value = toIso(form.getValues(name));
    try {
      picker.showPicker();
    } catch {
      // No showPicker (older Safari) — focusing a date input opens it there.
      picker.focus();
    }
  };

  const onPick = (event) => {
    const value = fromIso(event.target.value);
    if (!value) return;
    form.setValue(name, value, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Input
      placeholder="dd/mm/yyyy"
      inputMode="numeric"
      autoComplete="off"
      maxLength={10}
      {...props}
      {...maskedField(form, name, formatDobInput)}
      trailing={
        <>
          <button
            type="button"
            onClick={openPicker}
            aria-label="Pick date of birth from calendar"
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-orange-500 focus-visible:text-orange-500 focus:outline-none transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
          </button>
          <input
            ref={pickerRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            min="1900-01-01"
            max={latestAdultBirthday()}
            onChange={onPick}
            className="sr-only"
          />
        </>
      }
    />
  );
}

export default DobInput;
