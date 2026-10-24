import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

/**
 * Root layout — restores the session ONCE before rendering any route.
 * While hydrating we show a splash spinner; after that the group layouts
 * ((auth)/_layout and (app)/_layout) enforce the authenticated/unauthenticated
 * redirects, and app/index.tsx picks the correct entry screen.
 */
export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (status === "idle" || status === "hydrating") {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
});
