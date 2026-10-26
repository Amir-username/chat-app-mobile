import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

/**
 * Protected app group.
 * Signed out (initial load, logout, or a killed session)? Bounce to login.
 */
export default function AppLayout() {
  const status = useAuthStore((s) => s.status);

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="home" options={{ title: "Home" }} />
      <Stack.Screen name="profile" options={{ title: "My profile" }} />
      <Stack.Screen name="users/index" options={{ title: "Find people" }} />
      <Stack.Screen name="users/[id]" options={{ title: "Profile" }} />
      <Stack.Screen name="chats/index" options={{ title: "Chats" }} />
      <Stack.Screen name="chats/[id]" options={{ title: "Chat" }} />
    </Stack>
  );
}
