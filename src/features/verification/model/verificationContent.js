import {
  BadgeCheck,
  Banknote,
  CreditCard,
  Fingerprint,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { VERIFICATION } from "@/shared/store/verificationStore";

/**
 * Everything the waiting screen says, and every rule for deriving what it shows
 * from the store — kept out of the markup so the page is composition and the
 * components are presentation.
 *
 * The split is deliberate: a copy change, a fourth verdict, or a sixth document
 * lands in this file alone, and nothing here imports a component, so it can be
 * read (and unit-tested) without rendering anything.
 */

export const SUPPORT_EMAIL = "support@letsinsurance.com";

/**
 * What the back office is actually checking, one row per onboarding step. The
 * ids are what a rejection points at, so a reason lands against the document it
 * refers to rather than in a heap of error text at the top of the page.
 */
export const UNDER_REVIEW = [
  { id: "pan", icon: CreditCard, label: "PAN card", detail: "Name and number matched against the card" },
  { id: "aadhaar", icon: Fingerprint, label: "Aadhaar / KYC", detail: "Identity and address confirmed" },
  { id: "photo", icon: UserRound, label: "Photograph", detail: "Checked against your Aadhaar record" },
  { id: "bank", icon: Banknote, label: "Bank account", detail: "Verified for commission payouts" },
  { id: "education", icon: GraduationCap, label: "Education", detail: "Minimum qualification per IRDAI" },
];

/** The three stages either side of this screen — the journey, not a progress bar. */
export const STAGES = [
  { label: "Application submitted", detail: "Your details reached us" },
  { label: "Team verification", detail: "A reviewer checks your documents" },
  { label: "POSP training", detail: "15 hours, then the exam" },
];

/**
 * Everything that changes with the verdict, in one table rather than spread
 * across the markup as three-way ternaries. Adding a fourth status — an
 * "on hold pending a manual call", say — is an entry here, not a sweep of JSX.
 *
 * `copy` and `shortCopy` say the same thing at two lengths. The long one is a
 * desktop paragraph; on a phone the same text ran to ten lines of grey and read
 * as a wall, so below `sm` the short one is shown instead. Both make the same
 * promises — the short version is a trim, not a different message.
 *
 * `bandClass` tints the status band on mobile only. On a phone the verdict has
 * to be readable at arm's length before anything is parsed, and a colour wash
 * does that faster than a badge; on desktop the band stays white, where the
 * badge and the icon have room to carry it.
 */
export const STATUS_UI = {
  [VERIFICATION.PENDING]: {
    badge: "Under review",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-100",
    dotClass: "animate-pulse bg-amber-500 motion-reduce:animate-none",
    icon: ShieldCheck,
    iconClass: "bg-orange-50 text-orange-500 ring-orange-100",
    bandClass: "bg-amber-50/60",
    heading: "Your profile is with our team",
    copy: "A reviewer is checking your documents now. This usually takes 24 to 48 working hours, and we'll notify you the moment it's done — you don't need to keep this page open.",
    shortCopy: "A reviewer has your documents. Usually 24 to 48 working hours — we'll notify you when it's done.",
    checklistHeading: "With the reviewer",
    actionCaption: "Unlocks as soon as your profile is approved.",
    supportPrompt: "Waiting more than two working days?",
  },
  [VERIFICATION.VERIFIED]: {
    badge: "Verified",
    badgeClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    dotClass: "bg-emerald-500",
    icon: BadgeCheck,
    iconClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    bandClass: "bg-emerald-50/60",
    heading: "Your profile has been verified",
    copy: "Everything checked out. Your 15-hour POSP training programme is open — start whenever you're ready.",
    shortCopy: "Everything checked out. Your 15-hour training programme is open.",
    checklistHeading: "Checked and cleared",
    // Never rendered — the caption is suppressed once the button is live — but
    // carried so every status answers every key and no reader has to check.
    actionCaption: "Unlocks as soon as your profile is approved.",
    supportPrompt: "Waiting more than two working days?",
  },
  [VERIFICATION.REJECTED]: {
    badge: "Action needed",
    badgeClass: "bg-rose-50 text-rose-600 ring-rose-100",
    dotClass: "bg-rose-500",
    icon: ShieldAlert,
    iconClass: "bg-rose-50 text-rose-600 ring-rose-100",
    bandClass: "bg-rose-50/60",
    heading: "A few things need fixing",
    copy: "Our reviewer couldn't clear everything. Update the details flagged below and send your application back — the rest of your profile is already accepted, so you only need to fix what's marked.",
    shortCopy: "Some details need fixing. Update what's flagged and resend — the rest is already accepted.",
    checklistHeading: "Needs your attention",
    actionCaption: "Resubmitting puts you back in the review queue.",
    supportPrompt: "Think this is a mistake?",
  },
};

/**
 * The copy for a verdict, falling back to pending. Anything unrecognised in the
 * store renders the waiting screen rather than a blank one — the same safe
 * direction `readStatus` takes when localStorage holds something odd.
 */
export const statusUiFor = (status) =>
  STATUS_UI[status] ?? STATUS_UI[VERIFICATION.PENDING];

/**
 * Where each stage stands. Stage 1 is always behind us on this screen; stage 2
 * carries the verdict; stage 3 only goes live once the profile is cleared.
 *
 * Returns 'done' | 'current' | 'failed' | 'upcoming' — read by both trackers, so
 * the vertical trail and the mobile strip cannot drift apart.
 */
export const stageStateFor = (status, index) => {
  if (index === 0) return "done";

  if (index === 1) {
    if (status === VERIFICATION.VERIFIED) return "done";
    if (status === VERIFICATION.REJECTED) return "failed";
    return "current";
  }

  return status === VERIFICATION.VERIFIED ? "current" : "upcoming";
};

/**
 * The checklist as the screen needs it: every document paired with the reason it
 * was sent back (if it was) and whether it counts as cleared.
 *
 * Built once per verdict and handed to both lists, rather than each of them
 * scanning `rejections` per row. Cleared covers a full approval *and* the
 * documents a rejection didn't flag — those passed, and shouldn't read as though
 * they're still being looked at.
 */
export const buildDocumentStates = (status, rejections = []) => {
  const rejected = status === VERIFICATION.REJECTED;
  const verified = status === VERIFICATION.VERIFIED;
  const reasons = rejected
    ? new Map(rejections.map((entry) => [entry.id, entry]))
    : null;

  return UNDER_REVIEW.map((item) => {
    const rejection = reasons?.get(item.id);
    return { item, rejection, cleared: verified || (rejected && !rejection) };
  });
};
