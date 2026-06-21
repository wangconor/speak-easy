import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QuickAccessBar } from "@/components/QuickAccessBar";
import { makePaperTheme } from "@/constants/theme";
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
                  headerShown: false
                }}
              >
                <Stack.Screen name="(tabs)" />
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
