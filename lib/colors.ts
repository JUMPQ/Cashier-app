const DEFAULT_PRIMARY = "#2563eb";
const DEFAULT_SECONDARY = "#14b8a6";
const DEFAULT_BACKGROUND_LIGHT = "#f7fbff";
const DEFAULT_SURFACE_LIGHT = "#ffffff";
const DEFAULT_BACKGROUND_DARK = "#07111b";
const DEFAULT_SURFACE_DARK = "#101c2c";

function normalizeHex(color: string | undefined, fallback: string) {
  if (!color) {
    return fallback;
  }

  const value = color.trim();

  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value
      .slice(1)
      .split("")
      .map((chunk) => chunk + chunk)
      .join("")}`;
  }

  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }

  return fallback;
}

function hexToRgb(hex: string) {
  const clean = normalizeHex(hex, DEFAULT_PRIMARY).slice(1);
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const normalized = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return (
    0.2126 * normalized[0] + 0.7152 * normalized[1] + 0.0722 * normalized[2]
  );
}

function getReadableTextColor(hex: string) {
  return getLuminance(hex) > 0.55 ? "#0f172a" : "#f8fafc";
}

export function createCashierPalette(
  primaryColor?: string,
  secondaryColor?: string,
  scheme: "light" | "dark" = "light",
) {
  const primary = normalizeHex(primaryColor, DEFAULT_PRIMARY);
  const secondary = normalizeHex(secondaryColor, DEFAULT_SECONDARY);
  const dark = scheme === "dark";

  return {
    primary,
    secondary,
    background: dark ? DEFAULT_BACKGROUND_DARK : DEFAULT_BACKGROUND_LIGHT,
    surface: dark ? DEFAULT_SURFACE_DARK : DEFAULT_SURFACE_LIGHT,
    surfaceAlt: dark ? "#162236" : "#eef6ff",
    text: dark ? "#f8fafc" : "#0f172a",
    muted: dark ? "#94a3b8" : "#5b6470",
    border: dark ? "rgba(148, 163, 184, 0.18)" : "rgba(15, 23, 42, 0.08)",
    overlay: dark ? "rgba(2, 6, 23, 0.74)" : "rgba(15, 23, 42, 0.12)",
    shadow: dark ? "rgba(0, 0, 0, 0.35)" : "rgba(15, 23, 42, 0.12)",
    primarySoft: rgba(primary, dark ? 0.22 : 0.14),
    secondarySoft: rgba(secondary, dark ? 0.22 : 0.14),
    contrastOnPrimary: getReadableTextColor(primary),
    contrastOnSecondary: getReadableTextColor(secondary),
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#38bdf8",
  };
}
