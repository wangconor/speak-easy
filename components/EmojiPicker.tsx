import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Menu, Text, useTheme } from "react-native-paper";

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
  const [visible, setVisible] = useState(false);

  const choose = (emoji: string | null) => {
    onSelect(emoji);
    setVisible(false);
  };

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      contentStyle={styles.menu}
      anchor={
        <View>
          <Button
            accessibilityLabel="Emoji"
            contentStyle={styles.anchorContent}
            icon="menu-down"
            mode="outlined"
            onPress={() => setVisible(true)}
            style={styles.anchor}
          >
            {selected ? `${selected}  Selected` : "None"}
          </Button>
        </View>
      }
    >
      <View style={styles.grid}>
        <Pressable
          accessibilityLabel="No emoji"
          accessibilityRole="button"
          onPress={() => choose(null)}
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
            onPress={() => choose(emoji)}
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
    </Menu>
  );
}

const styles = StyleSheet.create({
  anchor: {
    borderRadius: 12
  },
  anchorContent: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 4
  },
  menu: {
    borderRadius: 14
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: 288,
    padding: 12
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
