/**
 * WCAG 2.1 relative-luminance and contrast-ratio helpers.
 * Used to lock the text palette to AA instead of picking greys by eye.
 */

export function parseHex(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function linearChannel(byte: number): number {
  const channel = byte / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance in 0..1 per WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return (
    0.2126 * linearChannel(r) +
    0.7152 * linearChannel(g) +
    0.0722 * linearChannel(b)
  );
}

/** Contrast ratio of two sRGB hex colors, always ≥ 1. */
export function contrastRatio(foreground: string, background: string): number {
  const lighter = relativeLuminance(foreground);
  const darker = relativeLuminance(background);
  const [hi, lo] = lighter >= darker ? [lighter, darker] : [darker, lighter];
  return (hi + 0.05) / (lo + 0.05);
}
