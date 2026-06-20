import Slider from "@react-native-community/slider";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Chip, Divider, RadioButton, Switch, Text, useTheme } from "react-native-paper";

import { ScreenState } from "@/components/ScreenState";
import { languageLabel, voiceLabel } from "@/constants/format";
import { fonts, spacing } from "@/constants/theme";
import { useAppData } from "@/context/AppDataContext";
import { alertDialog } from "@/services/dialog";
import { speakText } from "@/services/speech";
import type { Phrase } from "@/types";

const fallbackLanguages = ["en-US", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-BR", "zh-CN", "ja-JP"];

const sortPhrases = (phrases: Phrase[]) =>
  [...phrases].sort((left, right) => {
    if (left.isQuickAccess !== right.isQuickAccess) {
      return left.isQuickAccess ? -1 : 1;
    }
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }
    return (left.label || left.text).localeCompare(right.label || right.text);
  });

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    ready,
    settings,
    voices,
    phrases,
    patchPhrase,
    updateSettings,
    exportData,
    importData
  } = useAppData();
  const [rate, setRate] = useState(settings.rate);
  const [pitch, setPitch] = useState(settings.pitch);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRate(settings.rate);
  }, [settings.rate]);

  useEffect(() => {
    setPitch(settings.pitch);
  }, [settings.pitch]);

  const languageOptions = useMemo(() => {
    const seen = new Set<string>();
    return [settings.language, ...fallbackLanguages, ...voices.map((voice) => voice.language)].filter((language) => {
      if (!language || seen.has(language)) {
        return false;
      }
      seen.add(language);
      return true;
    });
  }, [settings.language, voices]);

  const filteredVoices = useMemo(() => {
    const normalized = settings.language.slice(0, 2).toLowerCase();
    return voices.filter((voice) => voice.language.toLowerCase().startsWith(normalized)).slice(0, 24);
  }, [settings.language, voices]);

  const quickCount = phrases.filter((phrase) => phrase.isQuickAccess).length;
  const phraseOptions = useMemo(() => sortPhrases(phrases), [phrases]);

  if (!ready) {
    return <ScreenState loading title="Loading settings" />;
  }

  const handleQuickToggle = async (phrase: Phrase) => {
    if (!phrase.isQuickAccess && quickCount >= 6) {
      alertDialog("Quick access full", "Remove a phrase from quick access first.");
      return;
    }
    await patchPhrase(phrase.id, { isQuickAccess: !phrase.isQuickAccess });
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportData();
      alertDialog("Export ready", "The backup file is ready to share.");
    } catch (error) {
      alertDialog("Export failed", error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const imported = await importData();
      if (imported) {
        alertDialog("Import complete", "Your phrases and packs were updated.");
      }
    } catch (error) {
      alertDialog("Import failed", error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        <View style={styles.chipWrap}>
          {languageOptions.map((language) => (
            <Chip
              key={language}
              selected={settings.language === language}
              onPress={() => updateSettings({ language, voiceId: null })}
              style={styles.chip}
            >
              {languageLabel(language)}
            </Chip>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice</Text>
        <RadioButton.Group
          onValueChange={(value) => updateSettings({ voiceId: value === "default" ? null : value })}
          value={settings.voiceId ?? "default"}
        >
          <RadioButton.Item label="System default" value="default" />
          {filteredVoices.map((voice) => (
            <RadioButton.Item
              key={voice.identifier}
              label={voiceLabel(voice)}
              value={voice.identifier}
            />
          ))}
        </RadioButton.Group>
      </View>

      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Rate</Text>
          <Text>{rate.toFixed(2)}</Text>
        </View>
        <Slider
          accessibilityLabel="Speech rate"
          maximumValue={1.5}
          minimumTrackTintColor={theme.colors.primary}
          minimumValue={0.5}
          onSlidingComplete={(value) => updateSettings({ rate: value })}
          onValueChange={setRate}
          step={0.05}
          thumbTintColor={theme.colors.primary}
          value={rate}
        />

        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>Pitch</Text>
          <Text>{pitch.toFixed(2)}</Text>
        </View>
        <Slider
          accessibilityLabel="Speech pitch"
          maximumValue={1.4}
          minimumTrackTintColor={theme.colors.primary}
          minimumValue={0.7}
          onSlidingComplete={(value) => updateSettings({ pitch: value })}
          onValueChange={setPitch}
          step={0.05}
          thumbTintColor={theme.colors.primary}
          value={pitch}
        />

        <Button mode="contained" onPress={() => speakText("This is SpeakEasy.", settings)} style={styles.fullButton}>
          Preview
        </Button>
      </View>

      <Divider />

      <View style={styles.section}>
        <View style={styles.quickHeader}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>{quickCount}/6</Text>
        </View>
        {phraseOptions.map((phrase) => (
          <View key={phrase.id} style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchLabel}>{phrase.label || phrase.text}</Text>
              <Text numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                {phrase.emoji || "💬"} {phrase.text}
              </Text>
            </View>
            <Switch value={phrase.isQuickAccess} onValueChange={() => handleQuickToggle(phrase)} />
          </View>
        ))}
      </View>

      <Divider />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup</Text>
        <View style={styles.actions}>
          <Button disabled={busy} loading={busy} mode="outlined" onPress={handleImport} style={styles.actionButton}>
            Import
          </Button>
          <Button disabled={busy} loading={busy} mode="contained" onPress={handleExport} style={styles.actionButton}>
            Export
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
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
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderRadius: 12,
    minHeight: 44
  },
  sliderHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  fullButton: {
    borderRadius: 12,
    minHeight: 50
  },
  quickHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 64
  },
  switchCopy: {
    flex: 1
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600"
  },
  actions: {
    flexDirection: "row",
    gap: 12
  },
  actionButton: {
    borderRadius: 12,
    flex: 1,
    minHeight: 50
  }
});
