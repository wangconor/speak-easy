import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Divider, Text, TextInput, useTheme } from "react-native-paper";

import { ScreenState } from "@/components/ScreenState";
import { fonts, spacing } from "@/constants/theme";
import { useAppData } from "@/context/AppDataContext";

export default function TypeToSpeakScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { ready, history, speakFreeText, clearScratchpadHistory } = useAppData();
  const [message, setMessage] = useState("");

  if (!ready) {
    return <ScreenState loading title="Loading scratchpad" />;
  }

  const trimmed = message.trim();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Type to Speak</Text>
        </View>

        <TextInput
          accessibilityLabel="Message"
          label="Message"
          mode="outlined"
          multiline
          onChangeText={setMessage}
          style={styles.input}
          value={message}
        />

        <View style={styles.actions}>
          <Button disabled={!trimmed} mode="contained" onPress={() => speakFreeText(trimmed)} style={styles.actionButton}>
            Speak
          </Button>
          <Button
            disabled={!trimmed}
            mode="outlined"
            onPress={() => router.push({ pathname: "/phrase/new", params: { text: trimmed } })}
            style={styles.actionButton}
          >
            Save
          </Button>
        </View>

        <Divider />

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>History</Text>
          {history.length > 0 ? (
            <Button mode="text" onPress={clearScratchpadHistory}>
              Clear
            </Button>
          ) : null}
        </View>

        {history.length === 0 ? (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>No messages yet</Text>
        ) : (
          history.map((item) => (
            <Pressable
              accessibilityHint="Speaks this message again"
              accessibilityLabel={item.text}
              accessibilityRole="button"
              key={item.id}
              onPress={() => speakFreeText(item.text)}
              style={({ pressed }) => [
                styles.historyItem,
                {
                  backgroundColor: pressed ? theme.colors.primaryContainer : theme.colors.surface,
                  borderColor: theme.colors.outline
                }
              ]}
            >
              <Text style={[styles.historyText, { color: theme.colors.onSurface }]}>{item.text}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 180
  },
  header: {
    gap: 2
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.4
  },
  input: {
    minHeight: 168
  },
  actions: {
    flexDirection: "row",
    gap: 12
  },
  actionButton: {
    borderRadius: 12,
    flex: 1,
    minHeight: 50
  },
  historyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2
  },
  historyItem: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 64,
    padding: 14
  },
  historyText: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23
  }
});
