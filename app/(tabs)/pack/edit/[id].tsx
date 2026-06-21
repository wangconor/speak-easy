import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Switch, Text, TextInput, useTheme } from "react-native-paper";

import { ColorPicker } from "@/components/ColorPicker";
import { DetailHeader } from "@/components/DetailHeader";
import { EmojiPicker } from "@/components/EmojiPicker";
import { ScreenState } from "@/components/ScreenState";
import { fonts, phraseColors, spacing } from "@/constants/theme";
import { useAppData } from "@/context/AppDataContext";
import { alertDialog, confirmDialog } from "@/services/dialog";
import type { Category } from "@/types";

export default function EditPackScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ready, categories } = useAppData();
  const pack = categories.find((category) => category.id === id);

  if (!ready) {
    return <ScreenState loading title="Loading pack" />;
  }

  if (!pack) {
    return <ScreenState title="Pack not found" actionLabel="Packs" onAction={() => router.replace("/(tabs)/packs")} />;
  }

  return <EditPackForm pack={pack} />;
}

function EditPackForm({ pack }: { pack: Category }) {
  const router = useRouter();
  const theme = useTheme();
  const { phrases, saveCategory, patchPhrase, removeCategory } = useAppData();

  const [name, setName] = useState(pack.name);
  const [emoji, setEmoji] = useState<string | null>(pack.emoji ?? "⭐");
  const [color, setColor] = useState<string | null>(pack.color ?? phraseColors[0]);
  const [memberIds, setMemberIds] = useState<Set<string>>(
    () => new Set(phrases.filter((phrase) => phrase.categoryId === pack.id).map((phrase) => phrase.id))
  );
  const [saving, setSaving] = useState(false);

  const sortedPhrases = useMemo(
    () => [...phrases].sort((left, right) => (left.label || left.text).localeCompare(right.label || right.text)),
    [phrases]
  );

  const canSave = name.trim().length > 0 && !saving;

  const toggleMember = (phraseId: string) => {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(phraseId)) {
        next.delete(phraseId);
      } else {
        next.add(phraseId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    try {
      await saveCategory(pack.id, { name: name.trim(), emoji, color });

      // Move phrases in/out of this pack wherever membership changed. A phrase
      // belongs to one pack at a time, so removing it here drops it back to My
      // Phrases (categoryId: null).
      const moves = phrases
        .filter((phrase) => {
          const shouldBeMember = memberIds.has(phrase.id);
          const isMember = phrase.categoryId === pack.id;
          return shouldBeMember !== isMember;
        })
        .map((phrase) => patchPhrase(phrase.id, { categoryId: memberIds.has(phrase.id) ? pack.id : null }));
      await Promise.all(moves);

      router.replace(`/pack/${pack.id}`);
    } catch (error) {
      alertDialog("Could not save pack", error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "Delete pack",
      message: pack.name,
      confirmLabel: "Delete",
      destructive: true
    });
    if (!confirmed) {
      return;
    }
    await removeCategory(pack.id);
    router.replace("/(tabs)/packs");
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <DetailHeader title="Edit Pack" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <TextInput
            accessibilityLabel="Pack name"
            label="Pack name"
            mode="outlined"
            onChangeText={setName}
            value={name}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emoji</Text>
          <EmojiPicker selected={emoji} onSelect={setEmoji} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color</Text>
          <ColorPicker colors={phraseColors} onSelect={setColor} selected={color} />
        </View>

        <View style={styles.section}>
          <View style={styles.cardsHeader}>
            <Text style={styles.sectionTitle}>Cards in pack</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{memberIds.size} selected</Text>
          </View>
          {sortedPhrases.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No phrases yet. Create some first.</Text>
          ) : (
            sortedPhrases.map((phrase) => (
              <View key={phrase.id} style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchLabel}>{phrase.label || phrase.text}</Text>
                  <Text numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                    {phrase.emoji || "💬"} {phrase.text}
                  </Text>
                </View>
                <Switch value={memberIds.has(phrase.id)} onValueChange={() => toggleMember(phrase.id)} />
              </View>
            ))
          )}
        </View>

        <Button disabled={!canSave} loading={saving} mode="contained" onPress={handleSave} style={styles.button}>
          Save pack
        </Button>

        <Button mode="outlined" onPress={handleDelete} textColor={theme.colors.error} style={styles.button}>
          Delete pack
        </Button>
      </ScrollView>
    </View>
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
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2
  },
  cardsHeader: {
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
  button: {
    borderRadius: 8,
    minHeight: 50
  }
});
