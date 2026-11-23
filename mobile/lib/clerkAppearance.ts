import palette from "@/lib/theme";

/** Shared Clerk UI styling for the web sign-in and sign-up components. */
export const clerkAppearance = {
  variables: {
    colorPrimary: palette.brand.DEFAULT,
    colorBackground: palette.light.background,
    colorForeground: palette.light.text,
    colorMutedForeground: palette.light.muted,
    colorInput: palette.light.background,
    colorInputForeground: palette.light.text,
    colorNeutral: palette.light.border,
    borderRadius: "0.85rem",
  },
};
