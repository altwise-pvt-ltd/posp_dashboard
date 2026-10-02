import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { isRoutedPath } from '@/app/routes';

const TILE =
  'flex min-h-20 flex-col items-center gap-2 rounded-xl px-1 py-2 text-center';

const ROW =
  'flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left';

function ItemIcon({ item }) {
  const Icon = item.icon;

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50">
      {item.image ? (
        <img src={item.image} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      ) : (
        <Icon size={22} strokeWidth={1.75} className="text-slate-500" aria-hidden="true" />
      )}
    </span>
  );
}

function ItemContent({ item, list, soon }) {
  if (list) {
    return (
      <>
        <ItemIcon item={item} />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-800">{item.label}</span>
          {item.description && (
            <span className="block text-xs text-slate-500">{item.description}</span>
          )}
        </span>
      </>
    );
  }

  return (
    <>
      <ItemIcon item={item} />
      <span className="text-[11px] font-medium leading-tight text-slate-700">
        {item.label}
      </span>
      {soon && (
        <span className="-mt-1 text-[10px] font-medium leading-none text-slate-400">Soon</span>
      )}
    </>
  );
}

function SheetPanel({ title, items, list, onClose }) {
  const panelRef = useRef(null);
  const base = list ? ROW : TILE;

  // Take focus on open, hand it back to the tab that opened it on close.
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.12 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end bg-slate-900/60 lg:hidden"
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%', transition: { duration: 0.12, ease: 'easeIn' } }}
        // Fast start, soft landing.
        transition={{ type: 'tween', duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
        // Swipe down to dismiss.
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 || info.velocity.y > 500) onClose();
        }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[80dvh] w-full overflow-y-auto rounded-t-2xl bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none will-change-transform"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X size={15} />
          </button>
        </div>

        <ul
          className={`m-0 list-none p-0 ${
            list ? 'flex flex-col gap-2' : 'grid grid-cols-4 gap-1'
          }`}
        >
          {items.map((item) => (
            <li key={item.to}>
              {isRoutedPath(item.to) ? (
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  draggable={false}
                  className={({ isActive }) =>
                    `${base} transition-colors active:bg-slate-100 ${
                      isActive ? 'border-orange-200 bg-orange-50' : ''
                    }`
                  }
                >
                  <ItemContent item={item} list={list} />
                </NavLink>
              ) : (
                // No page yet — shown, but it does not navigate.
                <div aria-disabled="true" className={`${base} opacity-50`}>
                  <ItemContent item={item} list={list} soon />
                </div>
              )}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

/**
 * Bottom sheet of nav links, opened from a bottom-bar tab. Items render as an
 * icon grid, or as full-width rows with `list`.
 */
export default function NavSheet({ open, title, items, list = false, onClose }) {
  return createPortal(
    <AnimatePresence>
      {open && <SheetPanel title={title} items={items} list={list} onClose={onClose} />}
    </AnimatePresence>,
    document.body
  );
}
