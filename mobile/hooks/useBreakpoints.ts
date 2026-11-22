import { useWindowDimensions } from "react-native";

import palette from "@/lib/theme";

/**
 * Single source of truth for responsive layout decisions across Expo screens.
 * Widths are ASCENDING: compact < tablet < desktop.
 */
export function useBreakpoints() {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= palette.breakpoints.tablet;
  const isDesktop = width >= palette.breakpoints.desktop;
  const isCompact = !isTablet;

  const columns = isDesktop ? 4 : isTablet ? 3 : 2;
  const contentWidth = isDesktop
    ? palette.layout.wideContent
    : isTablet
      ? palette.layout.detailContent
      : palette.layout.compactContent;

  return { width, height, isCompact, isTablet, isDesktop, columns, contentWidth };
}

export default useBreakpoints;
