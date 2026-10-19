import DateInput from "./DateInput";
import { toLocalIsoDate } from "@/shared/lib/format";
import { MIN_AGE } from "@/shared/validation/dateOfBirthField";

// Latest birth date that makes someone MIN_AGE today.
const latestAdultBirthday = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - MIN_AGE);
  return toLocalIsoDate(date);
};

// Date-of-birth field: dd/mm/yyyy, picker limited to adults.
function DobInput(props) {
  return <DateInput min="1900-01-01" max={latestAdultBirthday()} {...props} />;
}

export default DobInput;
