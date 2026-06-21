import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator, Button, Switch, Text, useTheme } from "react-native-paper";

import { ScreenState } from "@/components/ScreenState";
import { isListenBackendConfigured } from "@/constants/config";
import { fonts, spacing } from "@/constants/theme";
import { useAppData } from "@/context/AppDataContext";
import {
  abortListening,
  ensureListenPermissions,
  startListening,
  stopListening,
  useSpeechRecognitionEvent
} from "@/services/listen";
import { fetchSuggestions } from "@/services/suggest";
import type { ConversationTurn } from "@/types";

const SUGGEST_DEBOUNCE_MS = 700;

export default function ListenScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { ready, listen, phrases, speakFreeText, updateListenSettings } = useAppData();

  const [listening, setListening] = useState(false);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [interim, setInterim] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirror of `turns` so async callbacks (speech events, debounced suggest)
  // always read the latest conversation without stale closures.
  const turnsRef = useRef<ConversationTurn[]>([]);

  const runSuggest = useCallback(
    async (conversation: ConversationTurn[]) => {
      if (conversation.length === 0) {
        return;
      }
      setLoadingSuggest(true);
      setError(null);
      try {
        const result = await fetchSuggestions({ conversation, language: listen.language, phrases });
        setSuggestions(result);
      } catch (suggestError) {
        setError(suggestError instanceof Error ? suggestError.message : String(suggestError));
      } finally {
        setLoadingSuggest(false);
      }
    },
    [listen.language, phrases]
  );

  const scheduleSuggest = useCallback(
    (conversation: ConversationTurn[]) => {
      if (!listen.autoSuggest) {
        return;
      }
      if (suggestTimer.current) {
        clearTimeout(suggestTimer.current);
      }
      suggestTimer.current = setTimeout(() => runSuggest(conversation), SUGGEST_DEBOUNCE_MS);
    },
    [listen.autoSuggest, runSuggest]
  );

  const appendTurn = useCallback((turn: ConversationTurn) => {
    const next = [...turnsRef.current, turn];
    turnsRef.current = next;
    setTurns(next);
    return next;
  }, []);

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    const text = (event.results[0]?.transcript ?? "").trim();
    if (event.isFinal) {
      setInterim("");
      if (!text) {
        return;
      }
      const next = appendTurn({ role: "partner", text });
      scheduleSuggest(next);
    } else {
      setInterim(event.results[0]?.transcript ?? "");
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    setError(event.message || event.error || "Speech recognition error");
    setListening(false);
  });

  useEffect(
    () => () => {
      if (suggestTimer.current) {
        clearTimeout(suggestTimer.current);
      }
      abortListening();
    },
    []
  );

  if (!ready) {
    return <ScreenState loading title="Loading Listen" />;
  }

  const backendReady = isListenBackendConfigured();

  const resetConversation = () => {
    turnsRef.current = [];
    setTurns([]);
    setInterim("");
    setSuggestions([]);
    setError(null);
  };

  const handleToggle = async () => {
    setError(null);
    if (listening) {
      stopListening();
      return;
    }
    const granted = await ensureListenPermissions();
    if (!granted) {
      setError("Microphone and speech recognition permission is required to listen.");
      return;
    }
    try {
      startListening(listen.language);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : String(startError));
    }
  };

  // Speaking a suggestion is itself a conversational turn — record it so the
  // next round of suggestions knows what the user just said.
  const handleSpeak = (text: string) => {
    speakFreeText(text);
    appendTurn({ role: "me", text });
  };

  // One-time consent gate. Listening records a second person's voice, so make
  // the user explicitly opt in before the microphone can be enabled.
  if (!listen.hasConsented) {
    return (
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Listen</Text>
        </View>
        <View style={[styles.consentCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          <Text style={[styles.consentTitle, { color: theme.colors.onSurface }]}>Before you start</Text>
          <Text style={[styles.consentBody, { color: theme.colors.onSurfaceVariant }]}>
            Listen mode uses your device microphone to follow the conversation and asks AI to suggest short replies you
            can tap to speak.
            {"\n\n"}
            What the other person says is sent to a private AI service to generate suggestions. Please make sure people
            around you know the microphone is on. Recognition runs only while you choose to listen.
          </Text>
          <Button mode="contained" onPress={() => updateListenSettings({ hasConsented: true })} style={styles.consentButton}>
            I understand, enable Listen
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Listen</Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Suggested replies to what you hear
        </Text>
      </View>

      <Button
        icon={listening ? "stop" : "microphone"}
        mode="contained"
        onPress={handleToggle}
        style={[styles.toggle, listening ? { backgroundColor: theme.colors.error } : null]}
        contentStyle={styles.toggleContent}
      >
        {listening ? "Stop listening" : "Start listening"}
      </Button>

      <View style={styles.optionRow}>
        <Text style={[styles.optionLabel, { color: theme.colors.onSurface }]}>Suggest replies automatically</Text>
        <Switch value={listen.autoSuggest} onValueChange={(value) => updateListenSettings({ autoSuggest: value })} />
      </View>

      {!backendReady ? (
        <View style={[styles.notice, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            AI suggestions are not configured yet. Add your Supabase keys and deploy the suggest-replies function (see
            LISTEN_SETUP.md). You can still see the live transcript below.
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.suggestHeader}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          {turns.length > 0 ? (
            <Button compact mode="text" onPress={resetConversation}>
              Clear
            </Button>
          ) : null}
        </View>
        <View style={[styles.transcriptBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          {turns.length === 0 && !interim ? (
            <Text style={[styles.transcriptText, { color: theme.colors.onSurfaceVariant }]}>
              {listening ? "Listening…" : "Press Start listening to begin."}
            </Text>
          ) : (
            <>
              {turns.map((turn, index) => (
                <Text key={index} style={styles.turnLine}>
                  <Text
                    style={[
                      styles.turnRole,
                      { color: turn.role === "me" ? theme.colors.primary : theme.colors.onSurfaceVariant }
                    ]}
                  >
                    {turn.role === "me" ? "You: " : "Them: "}
                  </Text>
                  <Text style={{ color: theme.colors.onSurface }}>{turn.text}</Text>
                </Text>
              ))}
              {interim ? (
                <Text style={[styles.turnLine, styles.interimLine, { color: theme.colors.onSurfaceVariant }]}>{interim}</Text>
              ) : null}
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.suggestHeader}>
          <Text style={styles.sectionTitle}>Suggested replies</Text>
          <Button
            compact
            disabled={turns.length === 0 || loadingSuggest || !backendReady}
            mode="text"
            onPress={() => runSuggest(turnsRef.current)}
          >
            Refresh
          </Button>
        </View>

        {loadingSuggest ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Thinking of replies…</Text>
          </View>
        ) : null}

        {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

        {!loadingSuggest && suggestions.length === 0 && !error ? (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            {backendReady ? "Replies will appear here as you listen." : "Connect the AI backend to see replies."}
          </Text>
        ) : null}

        {suggestions.map((suggestion, index) => (
          <Pressable
            accessibilityHint="Speaks this reply out loud. Long press to save it as a phrase."
            accessibilityLabel={suggestion}
            accessibilityRole="button"
            key={`${index}-${suggestion}`}
            onLongPress={() => router.push({ pathname: "/phrase/new", params: { text: suggestion } })}
            onPress={() => handleSpeak(suggestion)}
            style={({ pressed }) => [
              styles.suggestion,
              {
                backgroundColor: pressed ? theme.colors.primaryContainer : theme.colors.surface,
                borderColor: theme.colors.outline
              }
            ]}
          >
            <Text style={[styles.suggestionText, { color: theme.colors.onSurface }]}>{suggestion}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    flexGrow: 1,
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
  subtitle: {
    fontSize: 14,
    fontWeight: "500"
  },
  toggle: {
    borderRadius: 14
  },
  toggleContent: {
    minHeight: 56
  },
  optionRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600"
  },
  notice: {
    borderRadius: 12,
    padding: 14
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2
  },
  transcriptBox: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 96,
    padding: 14
  },
  transcriptText: {
    fontSize: 17,
    lineHeight: 24
  },
  turnLine: {
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 4
  },
  turnRole: {
    fontWeight: "700"
  },
  interimLine: {
    fontStyle: "italic"
  },
  suggestHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  error: {
    fontSize: 14,
    fontWeight: "500"
  },
  suggestion: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 60,
    justifyContent: "center",
    padding: 14
  },
  suggestionText: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24
  },
  consentCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  consentTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    fontWeight: "700"
  },
  consentBody: {
    fontSize: 15,
    lineHeight: 22
  },
  consentButton: {
    borderRadius: 12,
    minHeight: 50
  }
});
