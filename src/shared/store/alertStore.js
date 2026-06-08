import { create } from 'zustand';
import { alertLegend, DEFAULT_VARIANT } from '@/shared/components/alert/alertLegend';

// Simple incrementing id so every alert is unique — no external dep needed.
let nextId = 0;

/**
 * Global alert store. This is what makes the system "fire from anywhere":
 * any component reads `alerts` to render, and anyone can call `showAlert`
 * to push a new one without prop-drilling or context.
 */
export const useAlertStore = create((set, get) => ({
  alerts: [],

  // showAlert({ variant, title, message, duration? }) -> returns the id
  showAlert: ({ variant = DEFAULT_VARIANT, title = '', message = '', duration } = {}) => {
    const id = ++nextId;
    const legend = alertLegend[variant] ?? alertLegend[DEFAULT_VARIANT];
    // Caller may override timing; otherwise fall back to the legend default.
    const life = duration ?? legend.duration;

    set((state) => ({
      alerts: [...state.alerts, { id, variant, title, message }],
    }));

    // life === 0 means "sticky" — stays until the user closes it (errors).
    if (life > 0) {
      setTimeout(() => get().dismissAlert(id), life);
    }

    return id;
  },

  dismissAlert: (id) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

  clearAlerts: () => set({ alerts: [] }),
}));

/**
 * Hook-free helpers so you can fire alerts outside React too
 * (e.g. an axios response interceptor):
 *   showAlert({ variant: 'error', title: 'Network error' });
 */
export const showAlert = (opts) => useAlertStore.getState().showAlert(opts);
export const dismissAlert = (id) => useAlertStore.getState().dismissAlert(id);
export const clearAlerts = () => useAlertStore.getState().clearAlerts();

/**
 * Drop-in onInvalid handler for react-hook-form. Pass it as the second arg of
 * handleSubmit so a failed submit raises one warning toast summarizing the
 * issues:
 *   const onSubmit = form.handleSubmit(onValid, alertOnInvalid);
 * Validation uses the `warning` variant (it's "fix this", not a hard failure).
 * Shows the first field's message plus a count when several fields fail.
 */
export const alertOnInvalid = (errors) => {
  const messages = Object.values(errors ?? {})
    .map((e) => e?.message)
    .filter(Boolean);
  if (messages.length === 0) return;

  showAlert({
    variant: "warning",
    title:
      messages.length > 1
        ? `${messages.length} fields need your attention`
        : "Please check the highlighted field",
    message: messages[0],
  });
};
