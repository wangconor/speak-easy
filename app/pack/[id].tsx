import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { FAB, IconButton, Text, useTheme } from "react-native-paper";

import { PhraseCard } from "@/components/PhraseCard";
import { ScreenState } from "@/components/ScreenState";
import { fonts, spacing } from "@/constants/theme";
import { useAppData } from "@/context/AppDataContext";
import { confirmDialog } from "@/services/dialog";
import { usePhrases } from "@/hooks/usePhrases";
import type { Phrase } from "@/types";

export default function PackDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { ready, categories, removeCategory } = useAppData();
  const { phrases, reorderPhraseIds, speakPhrase } = usePhrases(id);
  const pack = categories.find((category) => category.id === id);
  const columns = Math.max(2, Math.min(6, Math.floor(width / 220)));
  const cellWidth = Math.floor((width - spacing.md * 2) / columns);

  if (!ready) {
    return <ScreenState loading title="Loading pack" />;
  }

  if (!pack) {
    return <ScreenState title="Pack not found" actionLabel="Packs" onAction={() => router.replace("/(tabs)/packs")} />;
  }

  const handleDeletePack = async () => {
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

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Phrase>) => (
    <ScaleDecorator>
      <View style={[styles.cell, { width: cellWidth }]}>
        <PhraseCard
          isActive={isActive}
          onEdit={() => router.push(`/phrase/${item.id}`)}
          onLongPress={drag}
          onPress={() => speakPhrase(item)}
          phrase={item}
        />
      </View>
    </ScaleDecorator>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () =>
            pack.isDefault ? null : (
              <IconButton accessibilityLabel="Delete pack" icon="delete" onPress={handleDeletePack} />
            )
        }}
      />

      <DraggableFlatList
        ListEmptyComponent={
          <ScreenState
            title="No phrases in this pack"
            actionLabel="Add phrase"
            onAction={() => router.push({ pathname: "/phrase/new", params: { categoryId: pack.id } })}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.emoji}>{pack.emoji || "📁"}</Text>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.colors.onBackground }]}>{pack.name}</Text>
              <Text style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>{phrases.length} phrases</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.list}
        data={phrases}
        key={`grid-${columns}`}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        numColumns={columns}
        onDragEnd={({ data }) => reorderPhraseIds(data.map((item) => item.id))}
        renderItem={renderItem}
      />

      <FAB
        accessibilityLabel="Add phrase"
        icon="plus"
        onPress={() => router.push({ pathname: "/phrase/new", params: { categoryId: pack.id } })}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  list: {
    padding: spacing.md,
    paddingBottom: 180
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: spacing.md,
    paddingHorizontal: 4
  },
  emoji: {
    fontSize: 38
  },
  headerCopy: {
    flex: 1,
    gap: 2
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.4
  },
  count: {
    fontSize: 14,
    fontWeight: "500"
  },
  cell: {
    padding: 6
  },
  fab: {
    borderRadius: 16,
    bottom: 164,
    position: "absolute",
    right: 18
  }
});
