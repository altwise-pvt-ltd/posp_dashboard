import { isAuthenticated } from '@/shared/store/authStore';
import { isOnboardingComplete } from '@/shared/store/onboardingStore';
import { isVerificationSeen } from '@/shared/store/verificationStore';
import { isTrainingComplete } from '@/shared/store/trainingStore';

/**
 * The funnel, in order, once.
 *
 * Sign in → finish onboarding → wait for the team to verify → pass the
 * certification exam → dashboard.
 *
 * This list is the only place that order is written down. Both halves of the
 * routing rule read it: `landingPath()` below walks it forwards to find where a
 * visitor belongs, and `RequireFunnel` walks it to decide whether to bounce
 * someone who jumped ahead. They used to be two hand-maintained lists — this
 * file and the guard nesting in App.jsx — which could silently disagree, and a
 * disagreement between them is an infinite redirect.
 *
 * To add a stage: add its entry here in position, add the matching line to the
 * `clear` map in RequireFunnel, and route its page with `through` set to the
 * stage before it. Nothing else needs to know.
 *
 *   id      — what a route's `through` / `forwardWhenClear` prop names
 *   path    — where an uncleared stage sends the user
 *   isClear — non-reactive snapshot read, for redirects outside React
 */
export const FUNNEL_STAGES = [
  { id: 'auth', path: '/login', isClear: isAuthenticated },
  { id: 'onboarding', path: '/onboarding', isClear: isOnboardingComplete },
  // Clear means approved *and* acknowledged — see `isVerificationSeen`. A POSP
  // whose approval landed while they were away is brought back here to be told,
  // rather than being dropped into training with no explanation of how they got
  // there. The `/posp-training` guard reads plain verified status, so the button
  // on that screen isn't held back by the flag it sets.
  { id: 'verification', path: '/verification', isClear: isVerificationSeen },
  { id: 'training', path: '/posp-training', isClear: isTrainingComplete },
];

/** Where a visitor lands once every stage is behind them. */
export const DASHBOARD_PATH = '/overview';

/**
 * Where a visitor belongs right now — read by the `/` redirect and the login
 * page's verify handler, so the two can never drift apart.
 *
 * Returns the earliest unfinished stage rather than the furthest one they could
 * technically reach, which is why the order of the list above matters.
 */
export const landingPath = () =>
  FUNNEL_STAGES.find((stage) => !stage.isClear())?.path ?? DASHBOARD_PATH;
