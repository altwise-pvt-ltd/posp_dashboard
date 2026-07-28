import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Smartphone, ShieldCheck, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import Input from "@/shared/components/Input";
import Button from "@/shared/components/Button";
import { showAlert, alertOnInvalid } from "@/shared/store/alertStore";

/* ── Schemas ── */
// Indian mobile: 10 digits, starts 6-9. (POSP flow already collects PAN/Aadhaar.)
const mobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
});

const otpSchema = z.object({
  otp: z.string().trim().length(6, "Enter the 6-digit code.").regex(/^\d{6}$/, "Code must be 6 digits."),
});

const RESEND_SECONDS = 30;

/**
 * LoginForm — mobile-number + OTP sign-in, modelled on the onboarding
 * EmailStep: enter mobile → Send OTP → enter the 6-digit code → Verify.
 * The OTP is mocked for now (any 6 digits pass); `onVerified(mobile)` fires
 * on success and the page handles signIn + navigation.
 */
export default function LoginForm({ onVerified }) {
  const [sentTo, setSentTo] = useState(null); // mobile the code was sent to
  const [cooldown, setCooldown] = useState(0);

  /* ── Mobile entry ── */
  const mobileForm = useForm({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: "" },
    mode: "onTouched",
  });

  /* ── OTP entry ── */
  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
    mode: "onTouched",
  });

  // Code is "live" only while the field still holds the number we sent to.
  // Editing the mobile naturally collapses the OTP section and re-arms Send OTP.
  const mobileValue = mobileForm.watch("mobile");
  const codeSent = sentTo && mobileValue.trim() === sentTo;

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

  // Keep the mobile field numeric and capped at 10 digits as the user types.
  const mobileField = mobileForm.register("mobile");
  const handleMobileChange = (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    mobileField.onChange(e);
  };

  const sendCode = mobileForm.handleSubmit((data) => {
    // TODO: call API to dispatch the OTP via SMS
    setSentTo(data.mobile.trim());
    otpForm.reset({ otp: "" });
    startCooldown();
    showAlert({
      variant: "success",
      title: "OTP sent",
      message: `We've sent a 6-digit code to +91 ${data.mobile.trim()}.`,
    });
  }, alertOnInvalid);

  const resend = () => {
    if (cooldown > 0) return;
    // TODO: call API to resend the OTP
    startCooldown();
    showAlert({
      variant: "info",
      title: "OTP resent",
      message: `A new code is on its way to +91 ${sentTo}.`,
    });
  };

  const otpField = otpForm.register("otp");
  const handleOtpChange = (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
    otpField.onChange(e);
  };

  const verify = otpForm.handleSubmit(() => {
    // TODO: verify the OTP with the API. For now any 6-digit code is accepted.
    onVerified?.(sentTo);
  }, alertOnInvalid);

  return (
    <div className="w-full max-w-[340px] sm:max-w-[400px] mx-auto rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_rgba(222,123,61,0.08)] overflow-hidden">

      {/* Header — padding and type scale with breakpoints */}
      <div className="px-5 sm:px-6 pt-6 pb-5 bg-linear-to-br from-orange-50/60 to-white border-b border-orange-100/60">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-orange-500 mb-3">
          <Smartphone size={13} strokeWidth={2.5} />
          Secure Sign In
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          Sign in to continue
        </h2>
        <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          We'll send a one-time code to your mobile number.
        </p>
      </div>

      <div className="px-5 sm:px-6 py-5 flex flex-col gap-4 sm:gap-5">

        {/* ── Mobile entry ── */}
        <form onSubmit={sendCode} className="flex flex-col gap-4 sm:gap-5">
          <Input
            id="mobile"
            type="tel"
            label="Mobile Number (+91) *"
            placeholder="10-digit mobile number"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            error={mobileForm.formState.errors.mobile?.message}
            {...mobileField}
            onChange={handleMobileChange}
          />

          {!codeSent && (
            <div className="flex gap-3 pt-1">
              <Button type="submit" className="flex-1 flex items-center justify-center gap-2">
                Send OTP <ArrowRight size={16} strokeWidth={2.5} />
              </Button>
            </div>
          )}
        </form>

        {/* ── OTP entry (fades in once the code is sent) ── */}
        {codeSent && (
          <form onSubmit={verify} className="anim-fade flex flex-col gap-4 sm:gap-5 pt-1 border-t border-slate-100">
            <p className="text-sm text-slate-500 pt-4 -mb-1">
              Enter the 6-digit code we sent to <strong className="text-slate-700">+91 {sentTo}</strong>.
            </p>

            <Input
              id="otp"
              label="One-Time Password *"
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
                disabled={cooldown > 0}
                className="inline-flex items-center gap-1.5 font-semibold text-orange-500 hover:text-orange-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw size={13} strokeWidth={2.5} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" className="flex-1 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} strokeWidth={2.5} /> Verify &amp; Sign In
              </Button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
}
