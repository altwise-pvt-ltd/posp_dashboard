import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ShieldCheck, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";

/* ── Schemas ── */
const emailSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
});

const otpSchema = z.object({
  otp: z.string().trim().length(6, "Enter the 6-digit code.").regex(/^[0-9]{6}$/, "Code must be 6 digits."),
});

const RESEND_SECONDS = 30;

export default function EmailStep({ onNext, initialValues }) {
  const [sentTo, setSentTo] = useState(null); // email the code was sent to
  const [cooldown, setCooldown] = useState(0);

  /* ── Email entry ── */
  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialValues?.email ?? "" },
    mode: "onTouched",
  });

  /* ── OTP entry ── */
  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
    mode: "onTouched",
  });

  // Code is "live" only while the field still holds the address we sent to.
  // Editing the email naturally collapses the OTP section and re-arms Send Code.
  const emailValue = emailForm.watch("email");
  const codeSent = sentTo && emailValue.trim() === sentTo;

  /* ── Resend cooldown ticker ── */
  const timerRef = useRef(null);
  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const sendCode = emailForm.handleSubmit((data) => {
    // TODO: call API to dispatch the verification code
    setSentTo(data.email.trim());
    otpForm.reset({ otp: "" });
    startCooldown();
  });

  const resend = () => {
    if (cooldown > 0) return;
    // TODO: call API to resend the code
    startCooldown();
  };

  const otpField = otpForm.register("otp");
  const handleOtpChange = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    otpField.onChange(e);
  };

  const verify = otpForm.handleSubmit(() => {
    // TODO: verify the code with the API
    onNext?.({ email: sentTo });
  });

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-7 pb-5 sm:pb-6 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <Mail size={13} strokeWidth={2.5} />
          Step 2 · Email Verification
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          Verify your email
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          We'll send a one-time code to confirm it's really you.
        </p>
      </div>

      <div className="px-5 sm:px-8 py-6 sm:py-7 flex flex-col gap-5">

        {/* ── Email entry ── */}
        <form onSubmit={sendCode} className="flex flex-col gap-5">
          <Input
            id="email"
            type="email"
            label="Email Address *"
            placeholder="you@example.com"
            autoComplete="email"
            error={emailForm.formState.errors.email?.message}
            {...emailForm.register("email")}
          />

          {!codeSent && (
            <div className="flex gap-3 pt-1">
              <Button type="submit" className="flex-1 flex items-center justify-center gap-2">
                Send Code <ArrowRight size={16} strokeWidth={2.5} />
              </Button>
            </div>
          )}
        </form>

        {/* ── OTP entry (fades in once the code is sent) ── */}
        {codeSent && (
          <form onSubmit={verify} className="anim-fade flex flex-col gap-5 pt-1 border-t border-slate-100">
            <p className="text-sm text-slate-500 pt-4 -mb-1">
              Enter the 6-digit code we sent to <strong className="text-slate-700">{sentTo}</strong>.
            </p>

            <Input
              id="otp"
              label="Verification Code *"
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              error={otpForm.formState.errors.otp?.message}
              className="font-mono tracking-[0.6em] text-center text-lg"
              {...otpField}
              onChange={handleOtpChange}
            />

            <div className="flex items-center justify-end -mt-1 text-sm">
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0}
                className="inline-flex items-center gap-1.5 font-semibold text-orange-500 hover:text-orange-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw size={13} strokeWidth={2.5} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" className="flex-1 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} strokeWidth={2.5} /> Verify Email
              </Button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
}
