import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

/**
 * Auth group — login & register.
 * Already signed in? Bounce straight into the app.
 */
export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);

  if (status === "authenticated") {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
