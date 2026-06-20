import { Platform } from "react-native";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

// Type system for the "studio" theme: an editorial serif for titles and
// phrase labels (the "content"), a clean humanist sans for controls and meta.
export const fonts = {
  display: Platform.select({
    web: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
    ios: "Palatino",
    android: "serif",
    default: "serif"
  }) as string,
  body: Platform.select({
    web: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    default: "System"
  }) as string
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
};

// Muted "studio" palette — desaturated inks that sit calmly on warm paper
// next to the teal accent, instead of the loud primaries of a toy app.
export const phraseColors = [
  "#3F6E8C", // blue
  "#5C7A5A", // green
  "#B08443", // amber
  "#B05B4D", // red
  "#7A6485", // purple
  "#2F7E6B", // teal
  "#A86A78", // rose
  "#7C776C" // gray
];

export const makePaperTheme = (scheme: string | null | undefined) => {
  const isDark = scheme === "dark";
  const base = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    roundness: 3,
    colors: {
      ...base.colors,
      // Deep teal accent, used sparingly — everything else is paper and ink.
      primary: isDark ? "#4FA98F" : "#1F6F5C",
      onPrimary: isDark ? "#06241C" : "#FFFFFF",
      primaryContainer: isDark ? "#12362C" : "#D9EAE3",
      onPrimaryContainer: isDark ? "#CFEAE0" : "#0E3A2F",
      secondary: isDark ? "#B7B3A7" : "#6E6A60",
      secondaryContainer: isDark ? "#2C2A25" : "#ECEAE1",
      onSecondaryContainer: isDark ? "#ECE8DF" : "#2A2926",
      background: isDark ? "#1A1916" : "#F4F2EC",
      onBackground: isDark ? "#ECE8DF" : "#23211C",
      surface: isDark ? "#232220" : "#FCFBF7",
      onSurface: isDark ? "#ECE8DF" : "#23211C",
      surfaceVariant: isDark ? "#2C2A25" : "#EBE8DF",
      onSurfaceVariant: isDark ? "#A29D92" : "#6E6A60",
      outline: isDark ? "#38362F" : "#DAD6CA",
      outlineVariant: isDark ? "#2C2A25" : "#E6E2D8",
      error: isDark ? "#F2B8B5" : "#A8443A"
    }
  };
};
