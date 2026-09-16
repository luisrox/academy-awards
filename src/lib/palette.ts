/**
 * Spec.md 8.1 color tokens. `--color-muted` is #B8A990: warm taupe that
 * clears WCAG AA (4.5:1) on `--color-surface` without competing with gold.
 */
export const PALETTE = {
  ink: "#0A0908",
  surface: "#141210",
  gold: "#C9A227",
  goldLight: "#E8C96A",
  muted: "#B8A990",
} as const;

export const AA_CONTRAST_MIN = 4.5;

/** Text colors that must remain readable on surface and ink. */
export const TEXT_TOKENS = {
  gold: PALETTE.gold,
  goldLight: PALETTE.goldLight,
  muted: PALETTE.muted,
} as const;
