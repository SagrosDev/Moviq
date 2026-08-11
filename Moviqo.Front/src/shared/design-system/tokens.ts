export const colorTokens = {
  surfaceBase: "#F8FAFC",
  surfaceRaised: "#FFFFFF",
  surfaceSoft: "#F1F5F9",
  inkPrimary: "#0F172A",
  inkSecondary: "#475569",
  inkDisabled: "#94A3B8",
  primary: "#0F766E",
  primaryHover: "#115E59",
  primaryForeground: "#FFFFFF",
  accent: "#2563EB",
  border: "#CBD5E1",
  controlBorder: "#64748B",
  focus: "#2563EB",
  warning: "#B45309",
  error: "#B91C1C",
  success: "#15803D"
} as const;

export const typographyTokens = {
  display: { size: 36, weight: 600, lineHeight: 1.15 },
  heading: { size: 24, weight: 600, lineHeight: 1.25 },
  body: { size: 16, weight: 400, lineHeight: 1.5 },
  label: { size: 14, weight: 600, lineHeight: 1.35 }
} as const;

export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const;

export const gutterTokens = {
  mobile: 16,
  desktop: 32
} as const;

export const radiusTokens = {
  field: 6,
  control: 10,
  guidance: 16,
  pill: 9999
} as const;

export const focusTokens = {
  color: colorTokens.focus,
  width: 3,
  offset: 3
} as const;

export const targetSizeTokens = {
  practicalMinimum: 44
} as const;

export const tokenContrastPairs = [
  { name: "body text", foreground: colorTokens.inkPrimary, background: colorTokens.surfaceBase, ratio: 4.5 },
  {
    name: "secondary text",
    foreground: colorTokens.inkSecondary,
    background: colorTokens.surfaceRaised,
    ratio: 4.5
  },
  {
    name: "primary control",
    foreground: colorTokens.primaryForeground,
    background: colorTokens.primary,
    ratio: 4.5
  },
  { name: "error state", foreground: colorTokens.error, background: colorTokens.surfaceRaised, ratio: 4.5 },
  {
    name: "success state",
    foreground: colorTokens.success,
    background: colorTokens.surfaceRaised,
    ratio: 4.5
  },
  {
    name: "form control boundary",
    foreground: colorTokens.controlBorder,
    background: colorTokens.surfaceRaised,
    ratio: 3
  },
  { name: "focus indicator", foreground: focusTokens.color, background: colorTokens.surfaceRaised, ratio: 3 }
] as const;

