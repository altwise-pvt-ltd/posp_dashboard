import {
  useVerificationStore,
  VERIFICATION,
} from "@/shared/store/verificationStore";

/**
 * Stands in for the back office until there is one. Delete this file and its one
 * import in the page when a real status call lands; nothing else depends on it,
 * because each button only calls the same store action that call will.
 *
 * It reads and writes the store itself rather than taking the verdict as props,
 * so removing it leaves no loose ends in the page.
 *
 * Desktop-only: it is scaffolding, and on a phone it was a wrapping full-width
 * row of it. `Approve()` / `Reject()` / `Pending()` still work from a remote
 * console if a verdict has to be flipped while testing on a device.
 */
export default function DemoStatusControl() {
  const status = useVerificationStore((s) => s.status);
  const approveVerification = useVerificationStore((s) => s.approveVerification);
  const rejectVerification = useVerificationStore((s) => s.rejectVerification);
  const submitForReview = useVerificationStore((s) => s.submitForReview);

  const states = [
    { label: "Pending", value: VERIFICATION.PENDING, apply: submitForReview },
    { label: "Verified", value: VERIFICATION.VERIFIED, apply: approveVerification },
    { label: "Rejected", value: VERIFICATION.REJECTED, apply: () => rejectVerification() },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-slate-300 bg-white/60 px-3.5 py-2.5">
      <p className="text-[11px] font-bold leading-4 text-slate-600">Demo control</p>
      <div className="flex items-center gap-1">
        {states.map(({ label, value, apply }) => (
          <button
            key={value}
            type="button"
            onClick={apply}
            aria-pressed={status === value}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors duration-200 ${
              status === value
                ? "bg-slate-800 text-white"
                : "border border-slate-200 bg-white text-slate-500 hover:border-orange-200 hover:text-orange-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
