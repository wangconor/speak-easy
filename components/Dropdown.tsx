import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Menu } from "react-native-paper";

export type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel?: string;
  placeholder?: string;
};

export function Dropdown({ options, value, onChange, accessibilityLabel, placeholder = "Select" }: DropdownProps) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <View>
          <Button
            accessibilityLabel={accessibilityLabel}
            contentStyle={styles.anchorContent}
            icon="menu-down"
            mode="outlined"
            onPress={() => setVisible(true)}
            style={styles.anchor}
          >
            {selected?.label ?? placeholder}
          </Button>
        </View>
      }
    >
      {options.map((option) => (
        <Menu.Item
          key={option.value}
          leadingIcon={option.value === value ? "check" : undefined}
          onPress={() => {
            onChange(option.value);
            setVisible(false);
          }}
          title={option.label}
        />
      ))}
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
  }
});
