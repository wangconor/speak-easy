import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { useTheme } from "react-native-paper";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <MaterialCommunityIcons color={String(color)} name={name} size={size} />
  );

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: { fontWeight: "600", fontSize: 12, letterSpacing: 0.1 },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 1,
          elevation: 0,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Phrases",
          tabBarIcon: tabIcon("message-text")
        }}
      />
      <Tabs.Screen
        name="packs"
        options={{
          title: "Packs",
          tabBarIcon: tabIcon("folder-multiple")
        }}
      />
      <Tabs.Screen
        name="listen"
        options={{
          title: "Listen",
          tabBarIcon: tabIcon("ear-hearing")
        }}
      />
      <Tabs.Screen
        name="type"
        options={{
          title: "Type",
          tabBarIcon: tabIcon("keyboard")
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: tabIcon("tune")
        }}
      />
      {/* Detail/form screens live inside the tab navigator so the bottom tab bar
          stays visible. href: null keeps them out of the tab bar itself. */}
      <Tabs.Screen name="phrase/new" options={{ href: null }} />
      <Tabs.Screen name="phrase/[id]" options={{ href: null }} />
      <Tabs.Screen name="pack/new" options={{ href: null }} />
      <Tabs.Screen name="pack/[id]" options={{ href: null }} />
    </Tabs>
  );
}
