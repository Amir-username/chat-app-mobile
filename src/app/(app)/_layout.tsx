import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { theme } from "@/theme";

/** Shared dark header styles for the pushed detail screens. */
const headerStyles = {
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.text,
  headerTitleStyle: { fontWeight: "700" as const, fontSize: 17 },
  headerShadowVisible: false,
};

/**
 * Protected app group.
 * Signed out (initial load, logout, or a killed session)? Bounce to login.
 *
 * Structure:
 *  (tabs)      → bottom tab bar (Chats / Search / Profile), no stack header —
 *                each tab renders its own header via the Tabs navigator
 *  users/[id]  → public profile, pushed ABOVE the tabs (covers the tab bar)
 *  chats/[id]  → conversation, pushed ABOVE the tabs (covers the tab bar)
 */
export default function AppLayout() {
  const status = useAuthStore((s) => s.status);

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="users/[id]"
        options={{ headerShown: true, title: "Profile", ...headerStyles }}
      />
      <Stack.Screen
        name="chats/[id]"
        options={{ headerShown: true, title: "Chat", ...headerStyles }}
      />
    </Stack>
  );
}
