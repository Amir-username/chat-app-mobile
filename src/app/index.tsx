import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

/**
 * Entry route — the root layout guarantees hydration has finished here,
 * so the status is deterministic ('authenticated' | 'unauthenticated').
 */
export default function Index() {
  const status = useAuthStore((s) => s.status);

  if (status === "authenticated") {
    return <Redirect href="/chats" />;
  }
  return <Redirect href="/(auth)/login" />;
}
