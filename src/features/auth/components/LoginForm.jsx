import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Lock, Download, RotateCcw, CheckCircle2 } from "lucide-react";
import { showAlert, alertOnInvalid } from "@/shared/store/alertStore";
import googlePlay from "@/assets/landing/google-play.png";
import appStore from "@/assets/landing/app-store.png";

/* ── Schemas ── */
// Indian mobile: 10 digits, starts 6-9. (POSP flow already collects PAN/Aadhaar.)
const mobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
});

const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, "Enter the 6-digit code.")
    .regex(/^\d{6}$/, "Code must be 6 digits."),
});

const RESEND_SECONDS = 30;

/* Field styling shared by the mobile and OTP inputs — flat white boxes with a
   soft orange focus ring, matching the landing card rather than the slate-50
   fields used inside the onboarding wizard. */
const FIELD =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#f47c3c] focus:ring-4 focus:ring-[#f47c3c]/15 transition-all";

/**
 * LoginForm — the "Login or Register" card that sits in the hero. Enter a
 * mobile number → Start Earning Now sends a code → enter the 6-digit OTP →
 * Verify. The OTP is mocked for now (any 6 digits pass); `onVerified(mobile)`
 * fires on success and the page handles signIn + navigation.
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
  // Editing the mobile naturally collapses the OTP section and re-arms sending.
  const mobileValue = mobileForm.watch("mobile");
  const codeSent = sentTo && mobileValue.trim() === sentTo;

  /* ── Resend cooldown ticker ── */
  const timerRef = useRef(null);
  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
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
    <div className="w-full max-w-[400px] rounded-2xl border border-slate-100 bg-white px-6 sm:px-8 py-8 shadow-[0_4px_24px_rgba(15,23,42,0.06),0_24px_56px_rgba(244,124,60,0.08)]">
      {/* ── Card heading ── */}
      <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
        Login or <span className="text-[#f47c3c]">Register</span>
      </h2>
      <p className="mt-1.5 text-center text-sm text-slate-500">
        Enter your mobile number to get started
      </p>
      <span className="mx-auto mt-3 block h-[3px] w-10 rounded-full bg-[#f47c3c]" />

      {/* ── Mobile entry ── */}
      <form onSubmit={sendCode} className="mt-7">
        <label
          htmlFor="mobile"
          className="mb-2 block text-sm font-medium text-slate-600"
        >
          Mobile Number
        </label>

        <div className="flex items-stretch gap-2">
          {/* Country code — India only for now, so it renders as a static prefix */}
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <span className="text-base leading-none">🇮🇳</span>
            +91
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          <input
            id="mobile"
            type="tel"
            placeholder="Enter Mobile Number"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            className={FIELD}
            {...mobileField}
            onChange={handleMobileChange}
          />
        </div>

        {mobileForm.formState.errors.mobile && (
          <p className="mt-1.5 text-xs font-medium text-red-500" role="alert">
            {mobileForm.formState.errors.mobile.message}
          </p>
        )}

        {!codeSent && (
          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-[#f47c3c] py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#e06a2e] focus:outline-none focus:ring-4 focus:ring-[#f47c3c]/30"
          >
            Start Earning Now
          </button>
        )}
      </form>

      {/* ── OTP entry (fades in once the code is sent) ── */}
      {codeSent && (
        <form onSubmit={verify} className="anim-fade mt-5">
          <label
            htmlFor="otp"
            className="mb-2 block text-sm font-medium text-slate-600"
          >
            Enter the 6-digit code sent to{" "}
            <strong className="font-semibold text-slate-800">
              +91 {sentTo}
            </strong>
          </label>

          <input
            id="otp"
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className={`${FIELD} text-center font-mono tracking-[0.4em]`}
            {...otpField}
            onChange={handleOtpChange}
          />

          {otpForm.formState.errors.otp && (
            <p className="mt-1.5 text-xs font-medium text-red-500" role="alert">
              {otpForm.formState.errors.otp.message}
            </p>
          )}

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#f47c3c] transition-colors hover:text-[#e06a2e] disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <RotateCcw size={13} strokeWidth={2.5} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>

          <button
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#f47c3c] py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#e06a2e] focus:outline-none focus:ring-4 focus:ring-[#f47c3c]/30"
          >
            <CheckCircle2 size={18} strokeWidth={2.5} />
            Verify &amp; Continue
          </button>
        </form>
      )}

      {/* ── Trust line ── */}
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <Lock size={13} className="text-slate-400" />
        100% Secure &amp; Trusted
      </p>

      {/* ── App download ── */}
      <div className="mt-6">
        <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700">
          Download App
          <Download size={15} />
        </p>
        <hr className="mt-3 border-slate-100" />

        <div className="mt-4 flex items-center gap-3">
          <a href="#" className="flex-1 transition-opacity hover:opacity-80">
            <img
              src={googlePlay}
              alt="Get it on Google Play"
              className="h-[52px] w-full rounded-lg object-cover"
            />
          </a>
          <a href="#" className="flex-1 transition-opacity hover:opacity-80">
            <img
              src={appStore}
              alt="Download on the App Store"
              className="h-[52px] w-full rounded-lg object-cover"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
