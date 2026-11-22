// Single source of truth for colors used by both Nativewind classes and inline styles.
// Keep this file free of secrets; it is bundled into the app.
const palette = {
  brand: {
    DEFAULT: "#0B6B4A",
    dark: "#0F7A52",
  },
  primary: {
    DEFAULT: "#34D399", // readable on dark surfaces; pairs with dark foreground text
    light: "#6EE7B7",
    dark: "#0F7A52",
  },
  background: {
    DEFAULT: "#121212",
    light: "#181818",
    lighter: "#282828",
  },
  surface: {
    DEFAULT: "#282828",
    light: "#3E3E3E",
  },
  text: {
    primary: "#FFFFFF",
    secondary: "#B3B3B3",
    tertiary: "#6A6A6A",
  },
  accent: {
    DEFAULT: "#34D399",
    danger: "#FF6B6B",
    warning: "#FFC107",
    info: "#00D9FF",
  },
  // Foreground color for text/icons placed on top of primary buttons.
  onPrimary: "#121212",
  // The sign-in screen intentionally uses a light surface for provider buttons.
  light: {
    background: "#FFFFFF",
    border: "#D1D5DB",
    text: "#111827",
    muted: "#6B7280",
    link: "#3B82F6",
    shadow: "#000000",
  },
  brandIcons: {
    google: "#4285F4",
  },
  overlay: "rgba(0,0,0,0.65)",
};

// Shared responsive breakpoints. Screens use these through useBreakpoints so
// column counts, content width, and navigation insets change at the same widths.
const breakpoints = {
  tablet: 768,
  desktop: 1200,
  expandedTabBar: 720,
};

const layout = {
  compactContent: 840,
  detailContent: 960,
  wideContent: 1280,
  modal: 420,
};

module.exports = { ...palette, breakpoints, layout };
