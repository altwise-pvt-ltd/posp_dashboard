/**
 * The single list of paths App.jsx actually renders. Everything else in the UI
 * — /leads, /policies, /reports, /drafts, the per-product onboarding paths —
 * is designed but has no page yet.
 *
 * Links pointing at an unbuilt path used to fall through the `*` catch-all and
 * dump the user on Overview, which reads as a broken navigation. `isRoutedPath`
 * lets link components stay inert instead: the click simply does nothing until
 * the page exists. Add a path here the moment you add its <Route>.
 */
export const ROUTES = [
  '/login',
  '/onboarding',
  '/overview',
  '/profile',
  '/posp-training',
];

/**
 * True when `to` resolves to a real page. Query strings and hashes are ignored,
 * and '/' counts because it always redirects somewhere valid via landingPath().
 * Nested paths are deliberately NOT matched by their parent — '/onboarding/health'
 * is unrouted even though '/onboarding' exists.
 */
export const isRoutedPath = (to) => {
  if (!to || typeof to !== 'string') return false;
  const path = to.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return path === '' || path === '/' || ROUTES.includes(path);
};
