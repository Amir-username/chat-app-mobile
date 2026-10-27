import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

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
        options={{ headerShown: true, title: "Profile" }}
      />
      <Stack.Screen
        name="chats/[id]"
        options={{ headerShown: true, title: "Chat" }}
      />
    </Stack>
  );
}
