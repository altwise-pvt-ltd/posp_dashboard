import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ShieldCheck, ArrowRight, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import { showAlert, alertOnInvalid } from "@/shared/store/alertStore";
import { reportFormError } from "@/shared/api/formErrors";
import { sendEmailOtp, verifyEmailOtp } from "../api/onboardingApi";

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
  /* `seconds` lets the server win. It is the one enforcing the throttle, so
     when it sends a Retry-After the local guess is wrong by definition — and
     wrong in the direction that offers a resend the server will refuse. */
  const startCooldown = (seconds) => {
    setCooldown(seconds > 0 ? Math.ceil(seconds) : RESEND_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  /* `sentTo` is set only after the server confirms the dispatch, so a failed
     send leaves the card on the email step rather than asking for a code that
     was never sent. */
  const sendCode = emailForm.handleSubmit(async (data) => {
    const email = data.email.trim();
    try {
      await sendEmailOtp(email);
      setSentTo(email);
      otpForm.reset({ otp: "" });
      // No argument: a successful send carries no throttle hint (its
      // `expiresInSeconds` is the code's lifetime, not a resend delay), so the
      // local 30s stands until the server objects with a 429.
      startCooldown();
      showAlert({
        variant: "success",
        title: "Verification code sent",
        message: `We've sent a 6-digit code to ${email}.`,
      });
    } catch (error) {
      // `fallbackField` is "email": this form has one input at this point, and
      // a server that rejects the send is rejecting the address in it.
      reportFormError(emailForm, error, "Couldn't send the code", "email");
    }
  }, alertOnInvalid);

  const [resending, setResending] = useState(false);

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await sendEmailOtp(sentTo);
      startCooldown();
      showAlert({
        variant: "info",
        title: "Code resent",
        message: `A new code is on its way to ${sentTo}.`,
      });
    } catch (error) {
      // A 429 here isn't a failure so much as the server's own throttle being
      // stricter than ours — adopt its clock so the button stops offering a
      // resend that would be refused again.
      if (error.status === 429 && error.retryAfter) {
        startCooldown(error.retryAfter);
      }
      reportFormError(otpForm, error, "Couldn't resend the code");
    } finally {
      setResending(false);
    }
  };

  const otpField = otpForm.register("otp");
  const handleOtpChange = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    otpField.onChange(e);
  };

  /**
   * Verify, then advance — in that order, and only on success. Calling `onNext`
   * first would tick the stepper and move the wizard on over an address the
   * server never confirmed.
   *
   * The code is blamed on failure ("otp"): by this point the address has
   * already been accepted for dispatch, so a rejection here is about the six
   * digits the user just typed — and that message ("Invalid OTP. 3 attempt(s)
   * remaining.") is the one they need under the field they're retyping.
   */
  const verify = otpForm.handleSubmit(async (data) => {
    try {
      await verifyEmailOtp(sentTo, data.otp.trim());
      onNext?.({ email: sentTo });
    } catch (error) {
      reportFormError(otpForm, error, "Couldn't verify the code", "otp");
    }
  }, alertOnInvalid);

  return (
    <div className="w-full max-w-89 sm:max-w-103.5 lg:max-w-112 xl:max-w-112 mx-auto lg:mx-0 rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-4 sm:px-5 lg:px-6 pt-5 pb-4 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <Mail size={13} strokeWidth={2.5} />
          Step 2 · Email Verification
        </span>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight">
          Verify your email
        </h2>
        <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1 lg:mt-2">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          We'll send a one-time code to confirm it's really you.
        </p>
      </div>

      <div className="px-4 sm:px-5 lg:px-6 py-5 flex flex-col gap-4 sm:gap-5">

        {/* ── Email entry ── */}
        <form onSubmit={sendCode} className="flex flex-col gap-4 sm:gap-5">
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
              <Button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {emailForm.formState.isSubmitting ? (
                  <>
                    <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                    Sending code…
                  </>
                ) : (
                  <>
                    Send Code <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </Button>
            </div>
          )}
        </form>

        {/* ── OTP entry (fades in once the code is sent) ── */}
        {codeSent && (
          <form onSubmit={verify} className="anim-fade flex flex-col gap-4 sm:gap-5 pt-1 border-t border-slate-100">
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
              className="font-mono tracking-[0.4em] text-center text-sm sm:text-base"
              {...otpField}
              onChange={handleOtpChange}
            />

            <div className="flex items-center justify-end -mt-1 text-sm">
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0 || resending}
                className="inline-flex items-center gap-1.5 font-semibold text-orange-500 hover:text-orange-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw
                  size={13}
                  strokeWidth={2.5}
                  className={resending ? "animate-spin" : undefined}
                />
                {resending
                  ? "Resending…"
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend code"}
              </button>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="submit"
                disabled={otpForm.formState.isSubmitting}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {otpForm.formState.isSubmitting ? (
                  <>
                    <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} strokeWidth={2.5} /> Verify Email
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
}
