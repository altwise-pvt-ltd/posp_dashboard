import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import Input from "./Input";
import { toLocalIsoDate } from "@/shared/lib/format";
import { MIN_AGE, splitDayMonthYear } from "@/shared/validation/dateOfBirthField";

const OPEN_KEYS = ["Enter", " ", "ArrowDown"];

// dd/mm/yyyy (form) → yyyy-mm-dd (date input).
const toIso = (dmy) => {
  const parts = splitDayMonthYear(dmy);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
};

// yyyy-mm-dd (date input) → dd/mm/yyyy (form).
const fromIso = (iso) => {
  const [year, month, day] = iso.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
};

// Latest birth date that makes someone MIN_AGE today.
const latestAdultBirthday = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - MIN_AGE);
  return toLocalIsoDate(date);
};

// Date-of-birth field that can only be filled from the calendar picker.
function DobInput({ form, name, className = "", ...props }) {
  const pickerRef = useRef(null);

  const openPicker = () => {
    const picker = pickerRef.current;
    picker.value = toIso(form.getValues(name));
    try {
      picker.showPicker();
    } catch {
      // Browsers without showPicker open the calendar on focus.
      picker.focus();
    }
  };

  const onPick = (event) => {
    const value = fromIso(event.target.value);
    if (value) form.setValue(name, value, { shouldValidate: true, shouldDirty: true });
  };

  const onKeyDown = (event) => {
    if (!OPEN_KEYS.includes(event.key)) return;
    event.preventDefault();
    openPicker();
  };

  return (
    <Input
      placeholder="dd/mm/yyyy"
      {...props}
      {...form.register(name)}
      readOnly
      aria-haspopup="dialog"
      onClick={openPicker}
      onKeyDown={onKeyDown}
      className={`cursor-pointer ${className}`}
      trailing={
        <>
          <CalendarDays
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
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
