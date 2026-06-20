import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { fonts } from "@/constants/theme";

type ScreenStateProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
};

export function ScreenState({ title, actionLabel, onAction, loading = false }: ScreenStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {loading ? <ActivityIndicator color={theme.colors.primary} size="large" /> : null}
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    justifyContent: "center",
    minHeight: 280,
    padding: 24
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.2,
    textAlign: "center"
  },
  button: {
    borderRadius: 12,
    minWidth: 160
  }
});
