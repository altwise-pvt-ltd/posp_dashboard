import { usePospProfileStore } from '@/shared/store/pospProfileStore';
import { useAuthStore } from '@/shared/store/authStore';

/**
 * Which half of the day it is, in the user's own clock. Boundaries are the
 * conversational ones rather than even thirds — nobody says "good afternoon" at
 * 11:30, and "evening" starts when the working day does its winding down.
 */
function greetingFor(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * `Rohan` out of `Rohan Sharma` — a greeting uses the name someone is called,
 * not the one on their PAN card. Everything after the first space is dropped,
 * so a middle name doesn't turn this into a form field.
 */
function firstName(fullName) {
  if (!fullName) return null;
  const [first] = fullName.trim().split(/\s+/);
  return first || null;
}

/** `Tuesday, 22 September` — no year, because "today" is the whole point. */
function todayLabel(date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * The same two sources, in the same order, as the topbar's `useAccount`:
 * `GET /posp/me` when a screen has already fetched it, the verify-otp reply
 * otherwise. Read, never fetched — `DashboardLayout` owns the call for the
 * pages this header appears on.
 */
function useGreetingName() {
  const profileName = usePospProfileStore((s) => s.profile?.fullName);
  const userName = useAuthStore((s) => s.user?.fullName);
  return firstName(profileName || userName);
}

/**
 * Both props exist for stories and tests; the page passes neither, and the
 * defaults below are the live values rather than sample text. A placeholder
 * name here is indistinguishable from a real one at a glance, which is how
 * "Good morning, Rohan" survived into a build nobody named Rohan was using.
 */
function GreetingHeader({ name, dateLabel }) {
  // Called unconditionally — `name ?? useGreetingName()` would short-circuit
  // the hook whenever the prop is supplied, which is a different hook order
  // between renders.
  const storedName = useGreetingName();
  const resolvedName = name ?? storedName;
  const now = new Date();
  const greeting = greetingFor(now.getHours());

  return (
    <div className="anim-fade">
      <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
        {/* No trailing comma when the record hasn't arrived — a bare
            "Good morning" reads as a greeting, "Good morning," reads as a
            missing field. */}
        {resolvedName ? `${greeting}, ${resolvedName}` : greeting}
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
        {dateLabel ?? todayLabel(now)} · Here's what's happening today.
      </p>
    </div>
  );
}

export default GreetingHeader;
