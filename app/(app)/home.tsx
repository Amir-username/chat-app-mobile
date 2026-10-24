import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { Screen } from "@/components/ui/Screen";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { theme } from "@/theme";

/**
 * Temporary session test screen — proves the full auth loop works:
 * register → auto-login → session restored on cold start → logout.
 * Phase 3 replaces this with the real chats list.
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      // Success → (app)/_layout redirects to login
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Signed in</Text>
        <Text style={styles.subtitle}>
          The auth loop works. This placeholder is replaced by the chats list in
          Phase 3.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Email</Text>
        <Text style={styles.cardValue}>{user?.email ?? "—"}</Text>

        <Text style={styles.cardLabel}>Roles</Text>
        <Text style={styles.cardValue}>
          {user?.roles && user.roles.length > 0
            ? user.roles.join(", ")
            : "user"}
        </Text>

        <Text style={styles.cardLabel}>User ID</Text>
        <Text style={styles.cardValue}>{String(user?.id ?? "—")}</Text>
      </View>

      <PrimaryButton title="Sign out" onPress={onLogout} loading={loggingOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
});
