import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton, Text, useTheme } from "react-native-paper";

import { fonts, spacing } from "@/constants/theme";

type DetailHeaderProps = {
  title?: string;
  right?: ReactNode;
};

// Lightweight in-screen header (back button + title + optional action) used by
// the detail/form screens that live inside the tab navigator, where there is no
// native stack header. Keeps the bottom tab bar visible while still giving a
// clear way back.
export function DetailHeader({ title, right }: DetailHeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.xs, backgroundColor: theme.colors.background }]}>
      <IconButton accessibilityLabel="Go back" icon="arrow-left" onPress={() => router.back()} />
      <Text numberOfLines={1} style={[styles.title, { color: theme.colors.onBackground }]}>
        {title ?? ""}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    flexDirection: "row",
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.2
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 48
  }
});
