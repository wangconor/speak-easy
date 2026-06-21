import { useRouter } from "expo-router";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FAB, Text, useTheme } from "react-native-paper";

import { PhraseCard } from "@/components/PhraseCard";
import { ScreenState } from "@/components/ScreenState";
import { fonts, spacing } from "@/constants/theme";
import { usePhrases } from "@/hooks/usePhrases";
import type { Phrase } from "@/types";

export default function MyPhrasesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { ready, error, phrases, reload, reorderPhraseIds, speakPhrase } = usePhrases(null);
  const columns = Math.max(2, Math.min(6, Math.floor(width / 220)));
  const cellWidth = Math.floor((width - spacing.md * 2) / columns);

  if (!ready) {
    return <ScreenState loading title="Loading phrases" />;
  }

  if (error) {
    return <ScreenState title={error} actionLabel="Try again" onAction={reload} />;
  }

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
      <DraggableFlatList
        ListEmptyComponent={<ScreenState title="No phrases yet" actionLabel="Add phrase" onAction={() => router.push("/phrase/new")} />}
        contentContainerStyle={styles.list}
        data={phrases}
        key={`grid-${columns}`}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        numColumns={columns}
        onDragEnd={({ data }) => reorderPhraseIds(data.map((item) => item.id))}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>My Phrases</Text>
            <Text style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>{phrases.length} saved</Text>
          </View>
        }
      />
      <FAB
        accessibilityLabel="Add phrase"
        icon="plus"
        onPress={() => router.push("/phrase/new")}
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 24 }]}
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
    gap: 4,
    paddingBottom: spacing.lg,
    paddingHorizontal: 4
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
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
    position: "absolute",
    right: 18
  }
});
