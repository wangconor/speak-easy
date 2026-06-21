import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

import { DetailHeader } from "@/components/DetailHeader";
import { PhraseForm } from "@/components/PhraseForm";
import { ScreenState } from "@/components/ScreenState";
import { useAppData } from "@/context/AppDataContext";
import { alertDialog, confirmDialog } from "@/services/dialog";
import type { Phrase, PhraseInput } from "@/types";

const toInitialInput = (phrase: Phrase): PhraseInput => ({
  text: phrase.text,
  label: phrase.label,
  emoji: phrase.emoji,
  color: phrase.color,
  categoryId: phrase.categoryId,
  voiceId: phrase.voiceId,
  language: phrase.language,
  isPinned: phrase.isPinned,
  isQuickAccess: phrase.isQuickAccess,
  sortOrder: phrase.sortOrder,
  isDefault: phrase.isDefault
});

export default function EditPhraseScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready, phrases, savePhrase, removePhrase } = useAppData();
  const phrase = phrases.find((item) => item.id === id);

  if (!ready) {
    return <ScreenState loading title="Loading phrase" />;
  }

  if (!phrase) {
    return <ScreenState title="Phrase not found" actionLabel="My Phrases" onAction={() => router.replace("/(tabs)")} />;
  }

  const handleSubmit = async (input: PhraseInput) => {
    try {
      await savePhrase(phrase.id, input);
      router.back();
    } catch (error) {
      alertDialog("Could not save phrase", error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "Delete phrase",
      message: phrase.label || phrase.text,
      confirmLabel: "Delete",
      destructive: true
    });
    if (!confirmed) {
      return;
    }
    try {
      await removePhrase(phrase.id);
      router.back();
    } catch (error) {
      alertDialog("Could not delete phrase", error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <DetailHeader title="Edit Phrase" />
      <PhraseForm
        initial={toInitialInput(phrase)}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  }
});
