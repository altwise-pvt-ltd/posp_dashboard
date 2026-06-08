import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * The Alert legend — the single source of truth for how each variant
 * looks and behaves. The caller only picks a `variant`; everything in
 * this table (icon, colors, default timing) is applied automatically.
 *
 * Colour ladder is intentional and identical across variants:
 *   bg  -> 50  (pale surface, low saturation on large area)
 *   border -> 200 (a soft edge, no shadow needed)
 *   icon/title -> 700 (lands the eye on "what happened")
 *   message -> 600 (one notch lighter than the title)
 *
 * duration: ms before auto-dismiss. 0 = sticky (user must close it).
 * Severity drives timing: good news vanishes fast, errors never do.
 */
export const alertLegend = {
  success: {
    icon: CheckCircle2,
    duration: 3000,
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-700',
    titleColor: 'text-green-700',
    messageColor: 'text-green-600',
  },
  error: {
    icon: XCircle,
    duration: 0,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-700',
    titleColor: 'text-red-700',
    messageColor: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    duration: 5000,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-700',
    titleColor: 'text-amber-700',
    messageColor: 'text-amber-600',
  },
  info: {
    icon: Info,
    duration: 4000,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconColor: 'text-orange-700',
    titleColor: 'text-orange-700',
    messageColor: 'text-orange-600',
  },
};

export const DEFAULT_VARIANT = 'info';
