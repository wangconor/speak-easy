import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, Text, TextInput, useTheme } from "react-native-paper";

import { EmojiPicker } from "@/components/EmojiPicker";
import { colorName } from "@/constants/format";
import { fonts, phraseColors, spacing } from "@/constants/theme";
import { useAppData } from "@/context/AppDataContext";
import { alertDialog } from "@/services/dialog";

export default function NewPackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { addCategory } = useAppData();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string | null>("⭐");
  const [color, setColor] = useState<string | null>(phraseColors[0]);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    try {
      const id = await addCategory({
        name: name.trim(),
        emoji,
        color
      });
      router.replace(`/pack/${id}`);
    } catch (error) {
      alertDialog("Could not save pack", error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]} keyboardShouldPersistTaps="handled">
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
        <View style={styles.colorRow}>
          {phraseColors.map((item) => (
            <Chip
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

      <Button disabled={!canSave} loading={saving} mode="contained" onPress={handleSave} style={styles.button}>
        Save pack
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
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
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  colorChip: {
    borderRadius: 8,
    minHeight: 44
  },
  button: {
    borderRadius: 8,
    minHeight: 50
  }
});
