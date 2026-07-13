import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { alertLegend, DEFAULT_VARIANT } from './alertLegend';

/**
 * A single toast. Purely presentational: hand it a variant + text and it
 * reads the legend for its icon and colours. It owns no state — the store
 * decides when it appears and disappears.
 */
function Alert({ variant = DEFAULT_VARIANT, title, message, onClose }) {
  const legend = alertLegend[variant] ?? alertLegend[DEFAULT_VARIANT];
  const Icon = legend.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      role="alert"
      className={`pointer-events-auto w-full max-w-sm flex items-start gap-3 p-4 rounded-xl border shadow-lg shadow-slate-900/5 backdrop-blur-sm ${legend.bg} ${legend.border}`}
    >
      <Icon className={`shrink-0 mt-0.5 ${legend.iconColor}`} size={20} strokeWidth={2.25} />

      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-sm font-semibold ${legend.titleColor}`}>{title}</p>
        )}
        {message && (
          <p className={`text-xs sm:text-sm ${legend.messageColor} ${title ? 'mt-0.5' : ''}`}>
            {message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className={`shrink-0 -mr-1 -mt-1 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-slate-400/30 transition-all duration-200 ${legend.iconColor}`}
      >
        <X size={16} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

export default Alert;
