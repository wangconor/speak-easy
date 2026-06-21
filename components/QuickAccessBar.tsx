import { useRouter, useSegments } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme } from "react-native-paper";

import { resolveColor } from "@/constants/format";
import { useAppData } from "@/context/AppDataContext";

export function QuickAccessBar() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { quickAccess, speakPhrase } = useAppData();

  if (quickAccess.length === 0) {
    return null;
  }

  const isTabs = segments[0] === "(tabs)";

  return (
    <View
      style={[
        styles.wrap,
        {
          bottom: insets.bottom + (isTabs ? 56 : 14)
        }
      ]}
    >
      <ScrollView
        accessibilityLabel="Quick access phrases"
        contentContainerStyle={styles.content}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        {quickAccess.map((phrase) => (
          <Pressable
            accessibilityHint="Speaks this quick phrase"
            accessibilityLabel={phrase.label || phrase.text}
            accessibilityRole="button"
            key={phrase.id}
            onLongPress={() => router.push("/(tabs)/settings")}
            onPress={() => speakPhrase(phrase)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
                borderColor: theme.colors.outline
              }
            ]}
          >
            <View style={[styles.accent, { backgroundColor: resolveColor(phrase.color) || theme.colors.primary }]} />
            <Text style={styles.emoji}>{phrase.emoji || "💬"}</Text>
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              numberOfLines={2}
              style={[styles.label, { color: theme.colors.onSurface }]}
            >
              {phrase.label || phrase.text}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    left: 12,
    position: "absolute",
    right: 12,
    zIndex: 20
  },
  content: {
    gap: 8,
    paddingHorizontal: 2
  },
  button: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 60,
    minWidth: 92,
    overflow: "hidden",
    paddingLeft: 14,
    paddingRight: 12,
    position: "relative"
  },
  accent: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4
  },
  emoji: {
    fontSize: 19
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 17,
    maxWidth: 90,
    textAlign: "left"
  }
});
