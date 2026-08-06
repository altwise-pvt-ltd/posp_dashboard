import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronDown,
  Lock,
  Download,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { showAlert, alertOnInvalid } from "@/shared/store/alertStore";
import BrandButton from "./landing/ui/BrandButton";
import StoreBadges from "./landing/ui/StoreBadges";
import Highlight from "./landing/ui/Highlight";

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
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-900 placeholder-slate-500 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

const LABEL = "mb-2 block text-sm font-medium text-slate-600";

function FieldError({ error }) {
  if (!error) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-red-500" role="alert">
      {error.message}
    </p>
  );
}

/* Strips non-digits and caps length as the user types, so the field can never
   hold a value the schema would reject on shape alone. */
const digitsOnly = (field, max) => (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, max);
  field.onChange(e);
};

/**
 * LoginForm — the "Login or Register" card that sits in the hero. Enter a
 * mobile number → Start Earning Now sends a code → enter the 6-digit OTP →
 * Verify. The OTP is mocked for now (any 6 digits pass); `onVerified(mobile)`
 * fires on success and the page handles signIn + navigation.
 */
export default function LoginForm({ onVerified }) {
  const [sentTo, setSentTo] = useState(null); // mobile the code was sent to
  const [cooldown, setCooldown] = useState(0);

  const mobileForm = useForm({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: "" },
    mode: "onTouched",
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
    mode: "onTouched",
  });

  // Code is "live" only while the field still holds the number we sent to.
  // Editing the mobile naturally collapses the OTP section and re-arms sending.
  const mobileValue = mobileForm.watch("mobile");
  const codeSent = Boolean(sentTo) && mobileValue.trim() === sentTo;

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

  const mobileField = mobileForm.register("mobile");
  const otpField = otpForm.register("otp");

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

  const verify = otpForm.handleSubmit(() => {
    // TODO: verify the OTP with the API. For now any 6-digit code is accepted.
    onVerified?.(sentTo);
  }, alertOnInvalid);

  return (
    <div id="login-form" className="w-full max-w-[380px] rounded-2xl border border-slate-100 bg-white px-6 py-8 shadow-brand-card sm:px-8">
      {/* ── Card heading ── */}
      <h2 className="text-center text-[26px] font-bold tracking-tight text-slate-900">
        Login or <Highlight>Register</Highlight>
      </h2>
      <p className="mt-1.5 text-center text-sm text-slate-500">
        Enter your mobile number to get started
      </p>
      <span className="mx-auto mt-3 block h-0.75 w-10 rounded-full bg-brand" />

      {/* ── Mobile entry ── */}
      <form onSubmit={sendCode} className="mt-7">
        <label htmlFor="mobile" className={LABEL}>
          Mobile Number
        </label>

        <div className="flex items-stretch gap-2">
          {/* Country code — India only for now, so it renders as a static prefix */}
          <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-lg font-bold text-slate-800">
            <span className="text-xl leading-none">🇮🇳</span>
            +91
            <ChevronDown size={18} className="text-slate-500" />
          </div>

          <input
            id="mobile"
            type="tel"
            placeholder="Enter Mobile Number"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            className={`${FIELD} font-mono tracking-[0.08em] placeholder:font-sans placeholder:tracking-normal`}
            {...mobileField}
            onChange={digitsOnly(mobileField, 10)}
          />
        </div>

        <FieldError error={mobileForm.formState.errors.mobile} />

        {!codeSent && (
          <BrandButton type="submit" size="field" className="mt-5 w-full">
            Start Earning Now
          </BrandButton>
        )}
      </form>

      {/* ── OTP entry (fades in once the code is sent) ── */}
      {codeSent && (
        <form onSubmit={verify} className="anim-fade mt-5">
          <label htmlFor="otp" className={LABEL}>
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
            onChange={digitsOnly(otpField, 6)}
          />

          <FieldError error={otpForm.formState.errors.otp} />

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <RotateCcw size={13} strokeWidth={2.5} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>

          <BrandButton type="submit" size="field" className="mt-4 w-full">
            <CheckCircle2 size={18} strokeWidth={2.5} />
            Verify &amp; Continue
          </BrandButton>
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
        <StoreBadges stretch className="mt-4" />
      </div>
    </div>
  );
}
