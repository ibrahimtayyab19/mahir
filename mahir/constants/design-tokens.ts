/**
 * Luminance Light Design Tokens
 * Strictly follows Section 2B of the Master Prompt.
 * NEVER invent colors — only use values defined here.
 */

// ── Color Palette ──
export const Colors = {
  surface: "#F9FAF2",
  surfaceDim: "#DADBD3",
  surfaceBright: "#F9FAF2",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F4F4EC",
  surfaceContainer: "#EEEEE6",
  surfaceContainerHigh: "#E8E9E1",
  surfaceContainerHighest: "#E2E3DB",
  onSurface: "#1A1C18",
  onSurfaceVariant: "#444840",
  inverseSurface: "#2F312C",
  inverseOnSurface: "#F1F1E9",
  outline: "#74796F",
  outlineVariant: "#C4C8BD",
  surfaceTint: "#4E6542",
  primary: "#4E6542",
  onPrimary: "#FFFFFF",
  primaryContainer: "#CEE9BD",
  onPrimaryContainer: "#526A47",
  inversePrimary: "#B4CEA4",
  secondary: "#5F5E5C",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E5E2DE",
  onSecondaryContainer: "#666461",
  tertiary: "#5E5E5E",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#E2E0DF",
  onTertiaryContainer: "#636363",
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#93000A",
  primaryFixed: "#D0EBBF",
  primaryFixedDim: "#B4CEA4",
  onPrimaryFixed: "#0C2005",
  onPrimaryFixedVariant: "#364D2C",
  secondaryFixed: "#E5E2DE",
  secondaryFixedDim: "#C9C6C3",
  onSecondaryFixed: "#1C1C1A",
  onSecondaryFixedVariant: "#484744",
  tertiaryFixed: "#E4E2E1",
  tertiaryFixedDim: "#C7C6C5",
  onTertiaryFixed: "#1B1C1B",
  onTertiaryFixedVariant: "#464746",
  background: "#F9FAF2",
  onBackground: "#1A1C18",
  surfaceVariant: "#E2E3DB",
} as const;

// ── Typography ──
export const Typography = {
  headlineXl: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8, // -0.02em at 40px
  },
  headlineLg: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64, // -0.02em at 32px
  },
  headlineMd: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24, // -0.01em at 24px
  },
  headlineSm: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 20,
    lineHeight: 28,
  },
  headlineXlMobile: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 32,
    lineHeight: 40,
  },
  bodyLg: {
    fontFamily: "Sora_400Regular",
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMd: {
    fontFamily: "Sora_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: "Sora_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  labelMd: {
    fontFamily: "Sora_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6, // 0.05em at 12px
  },
  labelSm: {
    fontFamily: "Sora_400Regular",
    fontSize: 11,
    lineHeight: 14,
  },
} as const;

// ── Spacing (8px grid) ──
export const Spacing = {
  unit: 8,
  stackSm: 8,
  stackMd: 16,
  stackLg: 32,
  gutter: 24,
  marginMobile: 16,
  marginDesktop: 48,
} as const;

// ── Border Radius ──
export const Radii = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
