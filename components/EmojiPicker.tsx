import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

const emojiOptions = [
  "⭐",
  "✅",
  "❌",
  "🙏",
  "🆘",
  "👋",
  "💬",
  "🍽️",
  "💧",
  "⚠️",
  "💊",
  "🚌",
  "📍",
  "💳",
  "🧭",
  "🙂",
  "⌨️",
  "📱",
  "🧾",
  "🪪"
];

type EmojiPickerProps = {
  selected: string | null;
  onSelect: (emoji: string | null) => void;
};

export function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel="No emoji"
        accessibilityRole="button"
        onPress={() => onSelect(null)}
        style={[
          styles.option,
          {
            borderColor: selected ? theme.colors.outline : theme.colors.primary,
            backgroundColor: selected ? theme.colors.surface : theme.colors.primaryContainer
          }
        ]}
      >
        <Text style={styles.none}>None</Text>
      </Pressable>

      {emojiOptions.map((emoji) => (
        <Pressable
          accessibilityLabel={`Emoji ${emoji}`}
          accessibilityRole="button"
          key={emoji}
          onPress={() => onSelect(emoji)}
          style={[
            styles.option,
            {
              borderColor: selected === emoji ? theme.colors.primary : theme.colors.outline,
              backgroundColor: selected === emoji ? theme.colors.primaryContainer : theme.colors.surface
            }
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  option: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    height: 56,
    justifyContent: "center",
    minWidth: 56,
    paddingHorizontal: 10
  },
  emoji: {
    fontSize: 26
  },
  none: {
    fontSize: 13,
    fontWeight: "700"
  }
});
