import { extendTailwindMerge } from "tailwind-merge";

const COLORS = [
  "background", "brand", "brand-hover", "brand-tint",
  "error", "error-container", "on-error", "on-error-container",
  "inverse-on-surface", "inverse-primary", "inverse-surface",
  "on-background", "on-surface", "on-surface-variant",
  "primary", "primary-container", "primary-fixed", "primary-fixed-dim",
  "on-primary", "on-primary-container", "on-primary-fixed", "on-primary-fixed-variant",
  "secondary", "secondary-container", "secondary-fixed", "secondary-fixed-dim",
  "on-secondary", "on-secondary-container", "on-secondary-fixed", "on-secondary-fixed-variant",
  "tertiary", "tertiary-container", "tertiary-fixed", "tertiary-fixed-dim",
  "on-tertiary", "on-tertiary-container", "on-tertiary-fixed", "on-tertiary-fixed-variant",
  "outline", "outline-variant",
  "surface", "surface-bright", "surface-dim", "surface-tint", "surface-variant",
  "surface-container", "surface-container-low", "surface-container-lowest",
  "surface-container-high", "surface-container-highest",
];

const FONTS = [
  "headline-lg", "headline-lg-mobile", "headline-md",
  "body-lg", "body-md", "data-currency", "data-mono", "label-caps",
];

const TEXT_SIZES = [
  "headline-lg", "headline-lg-mobile", "headline-md",
  "body-lg", "body-md", "data-currency", "data-mono",
  "label-caps", "field-label", "status-pill", "nav-sub",
];

const SPACING = ["unit", "gutter", "margin-mobile", "margin-desktop"];

export const mergeClasses = extendTailwindMerge({
  extend: {
    theme: {
      color: COLORS,
      font: FONTS,
      text: TEXT_SIZES,
      spacing: SPACING,
    },
  },
});
