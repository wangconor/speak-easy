import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, Divider, RadioButton, Switch, Text, TextInput, useTheme } from "react-native-paper";

import { EmojiPicker } from "@/components/EmojiPicker";
import { colorName, languageLabel, resolveColor, voiceLabel } from "@/constants/format";
import { fonts, phraseColors, spacing } from "@/constants/theme";
import { useAppData } from "@/context/AppDataContext";
import { alertDialog } from "@/services/dialog";
import { speakText } from "@/services/speech";
import type { PhraseInput } from "@/types";

type PhraseFormProps = {
  initial?: Partial<PhraseInput>;
  submitLabel: string;
  onSubmit: (input: PhraseInput) => Promise<void>;
  onDelete?: () => void;
};

export function PhraseForm({ initial, submitLabel, onSubmit, onDelete }: PhraseFormProps) {
  const theme = useTheme();
  const { categories, settings, voices, addCategory } = useAppData();

  const [text, setText] = useState(initial?.text ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [emoji, setEmoji] = useState<string | null>(initial?.emoji ?? null);
  const [color, setColor] = useState<string | null>(resolveColor(initial?.color) ?? phraseColors[0]);
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [language, setLanguage] = useState(initial?.language ?? "");
  const [voiceId, setVoiceId] = useState<string | null>(initial?.voiceId ?? null);
  const [isPinned, setIsPinned] = useState(Boolean(initial?.isPinned));
  const [isQuickAccess, setIsQuickAccess] = useState(Boolean(initial?.isQuickAccess));
  const [saving, setSaving] = useState(false);
  const [creatingPack, setCreatingPack] = useState(false);
  const [newPackName, setNewPackName] = useState("");
  const [creatingPackBusy, setCreatingPackBusy] = useState(false);

  const selectedLanguage = language.trim() || settings.language;
  const filteredVoices = useMemo(() => {
    const normalized = selectedLanguage.slice(0, 2).toLowerCase();
    return voices.filter((voice) => voice.language.toLowerCase().startsWith(normalized)).slice(0, 18);
  }, [selectedLanguage, voices]);

  const languageOptions = useMemo(() => {
    const seen = new Set<string>();
    return [settings.language, "en-US", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-BR", "zh-CN", "ja-JP", ...voices.map((voice) => voice.language)].filter(
      (option) => {
        if (!option || seen.has(option)) {
          return false;
        }
        seen.add(option);
        return true;
      }
    );
  }, [settings.language, voices]);

  const canSave = text.trim().length > 0 && !saving;

  const buildInput = (): PhraseInput => ({
    text: text.trim(),
    label: label.trim() || null,
    emoji,
    color,
    categoryId,
    language: language.trim() || null,
    voiceId,
    isPinned,
    isQuickAccess,
    sortOrder: initial?.sortOrder,
    isDefault: initial?.isDefault
  });

  const handleSubmit = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    try {
      await onSubmit(buildInput());
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePack = async () => {
    const name = newPackName.trim();
    if (!name || creatingPackBusy) {
      return;
    }
    setCreatingPackBusy(true);
    try {
      const id = await addCategory({ name });
      setCategoryId(id);
      setNewPackName("");
      setCreatingPack(false);
    } catch (error) {
      alertDialog("Could not create pack", error instanceof Error ? error.message : String(error));
    } finally {
      setCreatingPackBusy(false);
    }
  };

  const handleTest = () => {
    if (!text.trim()) {
      return;
    }
    speakText(text, settings, {
      language: language.trim() || null,
      voiceId
    });
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <TextInput
          accessibilityLabel="Phrase text"
          label="Phrase"
          mode="outlined"
          multiline
          onChangeText={setText}
          style={styles.phraseInput}
          value={text}
        />
        <TextInput
          accessibilityLabel="Button label"
          label="Button label"
          mode="outlined"
          onChangeText={setLabel}
          value={label ?? ""}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emoji</Text>
        <EmojiPicker selected={emoji} onSelect={setEmoji} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color</Text>
        <View style={styles.colorRow}>
          {phraseColors.map((item) => (
            <Chip
              accessibilityLabel={`Color ${item}`}
              compact={false}
              key={item}
              mode={color === item ? "flat" : "outlined"}
              onPress={() => setColor(item)}
              selected={color === item}
              style={[styles.colorChip, { backgroundColor: color === item ? item : theme.colors.surface }]}
              textStyle={{ color: color === item ? "#FFFFFF" : theme.colors.onSurface }}
            >
              {colorName(item)}
            </Chip>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pack</Text>
        <View style={styles.chipWrap}>
          <Chip selected={categoryId === null} onPress={() => setCategoryId(null)} style={styles.chip}>
            My Phrases
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
              style={styles.chip}
            >
              {(category.emoji ? `${category.emoji} ` : "") + category.name}
            </Chip>
          ))}
          <Chip icon="plus" onPress={() => setCreatingPack((value) => !value)} selected={creatingPack} style={styles.chip}>
            New pack
          </Chip>
        </View>
        {creatingPack ? (
          <View style={styles.newPackRow}>
            <TextInput
              accessibilityLabel="New pack name"
              autoFocus
              dense
              label="New pack name"
              mode="outlined"
              onChangeText={setNewPackName}
              onSubmitEditing={handleCreatePack}
              style={styles.newPackInput}
              value={newPackName}
            />
            <Button
              disabled={!newPackName.trim() || creatingPackBusy}
              loading={creatingPackBusy}
              mode="contained"
              onPress={handleCreatePack}
              style={styles.newPackButton}
            >
              Create
            </Button>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Placement</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchLabel}>Pinned</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Always sorted first</Text>
          </View>
          <Switch value={isPinned} onValueChange={setIsPinned} />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchLabel}>Quick access</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Show in bottom bar</Text>
          </View>
          <Switch value={isQuickAccess} onValueChange={setIsQuickAccess} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Speech</Text>
        <Text style={styles.fieldLabel}>Language</Text>
        <View style={styles.chipWrap}>
          <Chip selected={language.trim() === ""} onPress={() => setLanguage("")} style={styles.chip}>
            Default
          </Chip>
          {languageOptions.map((option) => (
            <Chip
              key={option}
              selected={language.trim() === option}
              onPress={() => {
                setLanguage(option);
                setVoiceId(null);
              }}
              style={styles.chip}
            >
              {languageLabel(option)}
            </Chip>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Voice</Text>
        <RadioButton.Group onValueChange={(value) => setVoiceId(value === "default" ? null : value)} value={voiceId ?? "default"}>
          <RadioButton.Item label="Default voice" value="default" />
          {filteredVoices.map((voice) => (
            <RadioButton.Item
              key={voice.identifier}
              label={voiceLabel(voice)}
              value={voice.identifier}
            />
          ))}
        </RadioButton.Group>
      </View>

      <Divider />

      <View style={styles.actions}>
        <Button disabled={!text.trim()} mode="outlined" onPress={handleTest} style={styles.actionButton}>
          Test
        </Button>
        <Button disabled={!canSave} loading={saving} mode="contained" onPress={handleSubmit} style={styles.actionButton}>
          {submitLabel}
        </Button>
      </View>

      {onDelete ? (
        <Button mode="outlined" onPress={onDelete} textColor={theme.colors.error} style={styles.deleteButton}>
          Delete phrase
        </Button>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: 180
  },
  section: {
    gap: spacing.md
  },
  phraseInput: {
    minHeight: 118
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.7
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  colorChip: {
    borderRadius: 10,
    minHeight: 44
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderRadius: 10,
    minHeight: 44
  },
  newPackRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  newPackInput: {
    flex: 1
  },
  newPackButton: {
    borderRadius: 10
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 60
  },
  switchCopy: {
    flex: 1,
    paddingRight: 16
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
    minHeight: 48
  },
  deleteButton: {
    borderRadius: 12,
    minHeight: 48
  }
});
