import { StyleSheet } from "react-native";

import palette from "@/lib/theme";

/** Shared styles for native Clerk email/password screens. */
export const authStyles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: palette.light.border,
    borderRadius: 14,
    backgroundColor: palette.light.background,
    paddingHorizontal: 16,
    color: palette.light.text,
    fontSize: 16,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.brand.DEFAULT,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: palette.brand.DEFAULT,
  },
  secondaryButtonLabel: {
    color: palette.brand.DEFAULT,
    fontSize: 16,
    fontWeight: "600",
  },
});
