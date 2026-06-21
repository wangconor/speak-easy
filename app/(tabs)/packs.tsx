import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FAB, Text, useTheme } from "react-native-paper";

import { ScreenState } from "@/components/ScreenState";
import { resolveColor } from "@/constants/format";
import { fonts, spacing } from "@/constants/theme";
import { usePacks } from "@/hooks/usePacks";

export default function PacksScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { ready, error, packs, reload } = usePacks();

  if (!ready) {
    return <ScreenState loading title="Loading packs" />;
  }

  if (error) {
    return <ScreenState title={error} actionLabel="Try again" onAction={reload} />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Packs</Text>
          <Text style={[styles.count, { color: theme.colors.onSurfaceVariant }]}>{packs.length} folders</Text>
        </View>

        {packs.map((pack) => (
          <Pressable
            accessibilityHint="Opens this phrase pack"
            accessibilityLabel={pack.name}
            accessibilityRole="button"
            key={pack.id}
            onPress={() => router.push(`/pack/${pack.id}`)}
            style={({ pressed }) => [
              styles.pack,
              {
                backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
                borderColor: theme.colors.outline
              }
            ]}
          >
            <View style={[styles.accent, { backgroundColor: resolveColor(pack.color) || theme.colors.primary }]} />
            <Text style={styles.emoji}>{pack.emoji || "📁"}</Text>
            <View style={styles.packCopy}>
              <Text style={[styles.packTitle, { color: theme.colors.onSurface }]}>{pack.name}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>{pack.phraseCount} phrases</Text>
            </View>
            <Pressable
              accessibilityHint="Opens pack editor"
              accessibilityLabel={`Edit ${pack.name}`}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.push(`/pack/edit/${pack.id}`)}
              style={({ pressed }) => [styles.editButton, { opacity: pressed ? 0.5 : 1 }]}
            >
              <MaterialCommunityIcons color={theme.colors.onSurfaceVariant} name="pencil-outline" size={20} />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>

      <FAB
        accessibilityLabel="Add pack"
        icon="plus"
        onPress={() => router.push("/pack/new")}
        style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: insets.bottom + 64 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 180
  },
  header: {
    gap: 4,
    paddingBottom: spacing.sm
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
  pack: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    minHeight: 84,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingLeft: 18,
    paddingVertical: 14,
    position: "relative"
  },
  accent: {
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4
  },
  emoji: {
    fontSize: 28
  },
  packCopy: {
    flex: 1,
    gap: 3
  },
  packTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2
  },
  editButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  fab: {
    borderRadius: 16,
    position: "absolute",
    right: 18
  }
});
