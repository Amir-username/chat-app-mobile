import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { getMyProfile } from "@/api/profileApi";
import { getApiErrorMessage } from "@/api/errors";
import type { ProfileResponse } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Screen } from "@/components/ui/Screen";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { resolveImageUrl } from "@/utils/config";
import { theme } from "@/theme";

/**
 * Home hub — entry point of the signed-in area.
 * Phase 3: quick navigation to people search and my profile.
 * The "Chats" row is wired to the chat list in Phase 4.
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Load the profile once for the greeting (name + avatar). UserOut from the
  // auth store has no name/image — GET /auth/me/profile has both.
  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        // Non-critical — greeting falls back to the email
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      // Success → (app)/_layout redirects to login
    } finally {
      setLoggingOut(false);
    }
  };

  const displayName = profile?.name ?? user?.email ?? "there";

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar
          uri={resolveImageUrl(profile?.profile_image)}
          name={profile?.name}
          size={56}
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>Hi, {displayName}</Text>
          <Text style={styles.subtitle}>{user?.email ?? ""}</Text>
        </View>
      </View>

      <NavRow
        title="Find people"
        subtitle="Search users by name and open their profile"
        onPress={() => router.push("/users")}
      />
      <NavRow
        title="My profile"
        subtitle="Edit your name, bio and profile photo"
        onPress={() => router.push("/profile")}
      />
      <NavRow
        title="Chats"
        subtitle="Private conversations"
        onPress={() => router.push("/chats")}
      />
      <View style={styles.spacer} />
      <PrimaryButton title="Sign out" onPress={onLogout} loading={loggingOut} />
    </Screen>
  );
}

interface NavRowProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: string;
}

function NavRow({ title, subtitle, onPress, disabled, badge }: NavRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        disabled && styles.rowDisabled,
        pressed && !disabled && styles.rowPressed,
      ]}
    >
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  headerText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  rowPressed: {
    borderColor: theme.colors.primary,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  rowSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
  },
  badge: {
    backgroundColor: "#E0E7FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: theme.spacing.sm,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  spacer: {
    flex: 1,
  },
});
