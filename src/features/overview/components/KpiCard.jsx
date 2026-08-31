import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isRoutedPath } from '@/app/routes';
import AppLink from '@/shared/components/AppLink';

const THEMES = {
  sky:     { iconBg: 'bg-sky-50',     iconText: 'text-sky-600',     iconHover: 'hover:bg-sky-100',     listLink: 'text-sky-600' },
  violet:  { iconBg: 'bg-violet-50',  iconText: 'text-violet-600',  iconHover: 'hover:bg-violet-100',  listLink: 'text-violet-600' },
  amber:   { iconBg: 'bg-amber-50',   iconText: 'text-amber-600',   iconHover: 'hover:bg-amber-100',   listLink: 'text-amber-600' },
  rose:    { iconBg: 'bg-rose-50',    iconText: 'text-rose-600',    iconHover: 'hover:bg-rose-100',    listLink: 'text-rose-600' },
  emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', iconHover: 'hover:bg-emerald-100', listLink: 'text-emerald-600' },
  primary: {
    iconBg: 'bg-primary-container',
    iconText: 'text-white',
    iconHover: 'hover:bg-primary-container/90',
    listLink: 'text-primary',
  },
};

function KpiCard({
  label,
  to,
  highlighted = false,
  toggleIcon,
  theme = 'sky',
  countView,
  listItems = [],
}) {
  const [showList, setShowList] = useState(false);
  const navigate = useNavigate();
  const t = THEMES[theme] || THEMES.sky;

  // Most KPI destinations (/leads, /policies, …) don't have pages yet. Until
  // they do the card is inert: no pointer cursor, no link role, no navigation.
  // The toggle button still works, so the card isn't dead — just not a link.
  const canNavigate = isRoutedPath(to);

  // p-4 below `sm`: at two-up on a phone these cards are ~175px, and the page
  // gutter would spend 48px of that before the number starts.
  const cardClasses = `${
    highlighted
      ? 'bg-gradient-to-br from-primary-fixed/30 to-white rounded-xl border border-gray-200 p-4 sm:p-gutter card-lift relative overflow-hidden'
      : 'bg-white rounded-xl border border-gray-200 p-4 sm:p-gutter card-lift relative'
  } ${canNavigate ? 'cursor-pointer' : ''}`;

  const handleCardClick = () => {
    if (canNavigate) navigate(to);
  };

  const handleKeyDown = (e) => {
    if (canNavigate && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      navigate(to);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    setShowList((v) => !v);
  };

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      role={canNavigate ? 'link' : undefined}
      tabIndex={canNavigate ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {highlighted && (
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary-container/15 rounded-full blur-xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between mb-unit relative">
        <p className={`font-label-caps text-label-caps ${highlighted ? 'text-primary' : 'text-on-surface-variant'}`}>
          {label}
        </p>
        <button
          type="button"
          onClick={handleToggle}
          className={`w-7 h-7 rounded-full ${t.iconBg} ${t.iconText} ${t.iconHover} flex items-center justify-center transition-colors ${
            highlighted ? 'shadow-[0_2px_8px_-2px_rgba(255,107,0,.3)]' : ''
          }`}
          aria-label={showList ? 'Show count' : 'Show recent list'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {showList ? 'close' : toggleIcon}
          </span>
        </button>
      </div>

      {!showList ? (
        <div className="anim-fade relative">{countView}</div>
      ) : (
        <div className="anim-fade flex flex-col gap-1.5 relative" onClick={(e) => e.stopPropagation()}>
          {listItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 text-body-md font-body-md py-0.5"
            >
              <span className={`text-on-surface truncate ${item.mono ? 'font-data-mono text-data-mono' : ''}`}>
                {item.title}
              </span>
              <span className={`font-data-mono text-data-mono shrink-0 ${item.metaColor || 'text-on-surface-variant'}`}>
                {item.meta}
              </span>
            </div>
          ))}
          <AppLink to={to} className={`font-data-mono text-data-mono hover:underline mt-1 ${t.listLink}`}>
            View all →
          </AppLink>
        </div>
      )}
    </div>
  );
}

export default KpiCard;
