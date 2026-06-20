import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { resolveColor } from "@/constants/format";
import { fonts } from "@/constants/theme";
import type { Phrase } from "@/types";

type PhraseCardProps = {
  phrase: Phrase;
  compact?: boolean;
  isActive?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onEdit?: () => void;
  style?: ViewStyle;
};

export function PhraseCard({
  phrase,
  compact = false,
  isActive = false,
  onPress,
  onLongPress,
  onEdit,
  style
}: PhraseCardProps) {
  const theme = useTheme();
  const label = phrase.label || phrase.text;
  const accent = resolveColor(phrase.color) || theme.colors.primary;
  const showBody = label.trim().toLowerCase() !== phrase.text.trim().toLowerCase();

  return (
    <View
      style={[
        styles.card,
        compact && styles.compact,
        {
          backgroundColor: isActive ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: isActive ? accent : theme.colors.outline
        },
        style
      ]}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <Pressable
        accessibilityHint="Speaks this phrase"
        accessibilityLabel={label}
        accessibilityRole="button"
        delayLongPress={220}
        onLongPress={onLongPress}
        onPress={onPress}
        style={({ pressed }) => [styles.speakArea, compact && styles.compactSpeakArea, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={[styles.header, onEdit || phrase.isPinned ? styles.headerWithActions : null]}>
          <Text style={compact ? styles.compactEmoji : styles.emoji}>{phrase.emoji || "💬"}</Text>
        </View>

        <Text
          numberOfLines={compact ? 2 : 3}
          style={[styles.label, compact && styles.compactLabel, { color: theme.colors.onSurface }]}
        >
          {label}
        </Text>

        {showBody && !compact ? (
          <Text numberOfLines={2} style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
            {phrase.text}
          </Text>
        ) : null}
      </Pressable>

      {phrase.isPinned || onEdit ? (
        <View style={styles.topActions}>
          {phrase.isPinned ? (
            <MaterialCommunityIcons
              accessibilityElementsHidden
              color={theme.colors.onSurfaceVariant}
              importantForAccessibility="no"
              name="pin"
              size={16}
            />
          ) : null}
          {onEdit ? (
            <Pressable
              accessibilityHint="Opens phrase editor"
              accessibilityLabel={`Edit ${label}`}
              accessibilityRole="button"
              hitSlop={10}
              onPress={onEdit}
              style={({ pressed }) => [styles.editButton, { opacity: pressed ? 0.5 : 1 }]}
            >
              <MaterialCommunityIcons color={theme.colors.onSurfaceVariant} name="pencil-outline" size={18} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 124,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  compact: {
    minHeight: 70,
    minWidth: 84
  },
  speakArea: {
    flex: 1,
    minHeight: 120,
    paddingHorizontal: 16,
    paddingLeft: 18,
    paddingVertical: 14
  },
  compactSpeakArea: {
    minHeight: 66,
    padding: 8
  },
  accent: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 10
  },
  headerWithActions: {
    paddingRight: 44
  },
  topActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    position: "absolute",
    right: 12,
    top: 12
  },
  editButton: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24
  },
  emoji: {
    fontSize: 26
  },
  compactEmoji: {
    fontSize: 20
  },
  label: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: 26
  },
  compactLabel: {
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center"
  },
  body: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 6
  }
});
