import { Headset } from "lucide-react";
import DocumentRow from "./DocumentRow";
import { SUPPORT_EMAIL } from "../model/verificationContent";

/**
 * The checklist from `sm` up: every document at once, three across from `lg`.
 *
 * Three columns turns five rows into two, which is half the height saving that
 * lets the whole screen sit inside one laptop viewport. Below `sm` this is
 * hidden and `MobileDocuments` takes over.
 */
export default function DocumentChecklist({ documents, supportPrompt }) {
  return (
    <ul className="mt-3.5 hidden gap-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
      {documents.map(({ item, rejection, cleared }) => (
        <DocumentRow
          key={item.id}
          item={item}
          rejection={rejection}
          cleared={cleared}
        />
      ))}

      {/* Support rides in the sixth cell rather than as its own strip — five
          items across three columns leave it empty anyway. */}
      <li className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
        <Headset
          className="mt-0.5 size-4 shrink-0 text-slate-400"
          strokeWidth={2}
          aria-hidden="true"
        />
        <p className="min-w-0 text-[11px] leading-4 text-slate-500">
          {supportPrompt} Write to{" "}
          <span className="font-semibold text-slate-700">{SUPPORT_EMAIL}</span>{" "}
          with your registered mobile number.
        </p>
      </li>
    </ul>
  );
}
