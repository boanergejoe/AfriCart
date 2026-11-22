const palette = require("./lib/theme.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: palette.brand,
        primary: palette.primary,
        background: palette.background,
        surface: palette.surface,
        text: palette.text,
        accent: palette.accent,
      },
    },
  },
  plugins: [],
};
