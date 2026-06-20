import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QuickAccessBar } from "@/components/QuickAccessBar";
import { fonts, makePaperTheme } from "@/constants/theme";
import { AppDataProvider } from "@/context/AppDataContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = makePaperTheme(colorScheme);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AppDataProvider>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: theme.colors.background },
                  headerStyle: { backgroundColor: theme.colors.surface },
                  headerTintColor: theme.colors.onSurface,
                  headerShadowVisible: false,
                  headerTitleStyle: { fontFamily: fonts.display, fontWeight: "700", letterSpacing: -0.2 }
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="phrase/new" options={{ presentation: "modal", title: "Add Phrase" }} />
                <Stack.Screen name="phrase/[id]" options={{ title: "Edit Phrase" }} />
                <Stack.Screen name="pack/new" options={{ presentation: "modal", title: "New Pack" }} />
                <Stack.Screen name="pack/[id]" options={{ title: "Pack" }} />
              </Stack>
              <QuickAccessBar />
            </View>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          </AppDataProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
