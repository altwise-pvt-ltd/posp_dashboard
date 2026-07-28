import { Link } from 'react-router-dom';
import { isRoutedPath } from '@/app/routes';

/**
 * Drop-in replacement for react-router's <Link> that refuses to navigate to a
 * page we haven't built yet. Routed targets behave exactly like <Link>;
 * unrouted ones render the same markup as an inert <span> — same styling, no
 * href, no navigation, and out of the tab order.
 *
 * See `@/app/routes` for the list of paths that count as real.
 */
export default function AppLink({ to, children, className, ...rest }) {
  if (isRoutedPath(to)) {
    return (
      <Link to={to} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <span
      role="link"
      aria-disabled="true"
      className={`${className ?? ''} cursor-default`}
      {...rest}
    >
      {children}
    </span>
  );
}
