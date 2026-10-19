import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import Input from "./Input";
import { dmyToIso, isoToDmy } from "@/shared/lib/format";

const OPEN_KEYS = ["Enter", " ", "ArrowDown"];

// Date field that always shows dd/mm/yyyy and can only be filled from the calendar picker.
// `min` and `max` are yyyy-mm-dd; the form value is dd/mm/yyyy.
function DateInput({ form, name, min, max, className = "", ...props }) {
  const pickerRef = useRef(null);

  const openPicker = () => {
    const picker = pickerRef.current;
    picker.value = dmyToIso(form.getValues(name));
    try {
      picker.showPicker();
    } catch {
      // Browsers without showPicker open the calendar on focus.
      picker.focus();
    }
  };

  const onPick = (event) => {
    const value = isoToDmy(event.target.value);
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
            min={min}
            max={max}
            onChange={onPick}
            className="sr-only"
          />
        </>
      }
    />
  );
}

export default DateInput;
