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
  Loader2,
} from "lucide-react";
import { showAlert, alertOnInvalid } from "@/shared/store/alertStore";
import { reportFormError } from "@/shared/api/formErrors";
import { requestOtp, resendOtp, verifyOtp } from "../api/authApi";
import BrandButton from "./landing/ui/BrandButton";
import StoreBadges from "./landing/ui/StoreBadges";
import Highlight from "./landing/ui/Highlight";

/* ── Schemas ── */
// Indian mobile: 10 digits, starts 6-9.
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
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

const LABEL = "mb-1.5 block text-sm font-medium text-slate-600";

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
 * Verify. Each step is a real request (see `features/auth/api/authApi`);
 * `onVerified({ token, user })` fires once the server accepts the code and the
 * page handles signIn + navigation.
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
  /* `seconds` lets the server win. It is the one enforcing the throttle, so
     when it sends a Retry-After the local guess is wrong by definition — and
     wrong in the direction that offers a resend the server will refuse. */
  const startCooldown = (seconds) => {
    setCooldown(seconds > 0 ? Math.ceil(seconds) : RESEND_SECONDS);
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

  /* `sentTo` is set only after the server confirms the dispatch, so a failed
     send leaves the card on the mobile step rather than asking for a code that
     was never sent. */
  const sendCode = mobileForm.handleSubmit(async (data) => {
    const mobile = data.mobile.trim();
    try {
      const result = await requestOtp(mobile);
      setSentTo(mobile);
      otpForm.reset({ otp: "" });
      startCooldown(result?.retryAfter);
      showAlert({
        variant: "success",
        title: "OTP sent",
        message: `We've sent a 6-digit code to +91 ${mobile}.`,
      });
    } catch (error) {
      reportFormError(mobileForm, error, "Couldn't send the code");
    }
  }, alertOnInvalid);

  const [resending, setResending] = useState(false);

  const resend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      const result = await resendOtp(sentTo);
      startCooldown(result?.retryAfter);
      showAlert({
        variant: "info",
        title: "OTP resent",
        message: `A new code is on its way to +91 ${sentTo}.`,
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

  /* Hands the verified session up to the page, which owns signIn + navigation.
     `verifyOtp` throws if the response carried no token, so anything reaching
     `onVerified` is a session the app can actually authenticate with.

     Awaited, because the handler does more than navigate: it fetches the
     onboarding status so the user lands on the step they left. Without the
     await, `isSubmitting` clears the moment the OTP is accepted and the button
     goes idle while that second call is still out — an unexplained pause on a
     form that looks finished. */
  const verify = otpForm.handleSubmit(async (data) => {
    try {
      const session = await verifyOtp(sentTo, data.otp.trim());
      await onVerified?.(session);
    } catch (error) {
      reportFormError(otpForm, error, "Couldn't verify the code", "otp");
    }
  }, alertOnInvalid);

  return (
    <div
      id="login-form"
      className="w-full max-w-[380px] rounded-2xl border border-slate-100 bg-white px-6 py-8 shadow-brand-card sm:px-8"
    >
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
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[15px] font-semibold text-slate-800">
            <span className="text-base leading-none">🇮🇳</span>
            +91
            <ChevronDown size={16} className="text-slate-500" />
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
          <BrandButton
            type="submit"
            size="field"
            className="mt-5 w-full"
            disabled={mobileForm.formState.isSubmitting}
          >
            {mobileForm.formState.isSubmitting ? (
              <>
                <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                Sending code…
              </>
            ) : (
              "Start Earning Now"
            )}
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
              disabled={cooldown > 0 || resending}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:text-slate-400"
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

          <BrandButton
            type="submit"
            size="field"
            className="mt-4 w-full"
            disabled={otpForm.formState.isSubmitting}
          >
            {otpForm.formState.isSubmitting ? (
              <>
                <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                <CheckCircle2 size={18} strokeWidth={2.5} />
                Verify &amp; Continue
              </>
            )}
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
