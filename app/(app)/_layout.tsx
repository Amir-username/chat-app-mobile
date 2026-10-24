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

  return <Stack screenOptions={{ headerShown: true }} />;
}
