import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Menu, Text, useTheme } from "react-native-paper";

import { colorName } from "@/constants/format";

type ColorPickerProps = {
  colors: string[];
  selected: string | null;
  onSelect: (color: string) => void;
};

export function ColorPicker({ colors, selected, onSelect }: ColorPickerProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  const choose = (color: string) => {
    onSelect(color);
    setVisible(false);
  };

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      contentStyle={styles.menu}
      anchor={
        <Pressable
          accessibilityLabel="Color"
          accessibilityRole="button"
          onPress={() => setVisible(true)}
          style={[styles.anchor, { borderColor: theme.colors.outline }]}
        >
          <View style={styles.anchorLeft}>
            {selected ? <View style={[styles.anchorDot, { backgroundColor: selected }]} /> : null}
            <Text style={[styles.anchorText, { color: theme.colors.onSurface }]}>
              {selected ? colorName(selected) : "None"}
            </Text>
          </View>
          <MaterialCommunityIcons color={theme.colors.onSurfaceVariant} name="menu-down" size={24} />
        </Pressable>
      }
    >
      <View style={styles.grid}>
        {colors.map((item) => {
          const isSelected = selected === item;
          return (
            <Pressable
              accessibilityLabel={`Color ${colorName(item)}`}
              accessibilityRole="button"
              key={item}
              onPress={() => choose(item)}
              style={[styles.dotWrap, { borderColor: isSelected ? theme.colors.primary : "transparent" }]}
            >
              <View style={[styles.dot, { backgroundColor: item }]} />
            </Pressable>
          );
        })}
      </View>
    </Menu>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 16
  },
  anchorLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  anchorDot: {
    borderRadius: 9,
    height: 18,
    width: 18
  },
  anchorText: {
    fontSize: 14,
    fontWeight: "500"
  },
  menu: {
    borderRadius: 14
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    maxWidth: 264,
    padding: 14
  },
  dotWrap: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 3,
    justifyContent: "center",
    padding: 3
  },
  dot: {
    borderRadius: 18,
    height: 36,
    width: 36
  }
});
