import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { chatApi } from "@/api";
import { getApiErrorMessage } from "@/api/errors";
import { getUserProfile } from "@/api/profileApi";
import type { ProfileResponse } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { resolveImageUrl } from "@/utils/config";
import { theme } from "@/theme";

/**
 * Public profile — GET /auth/users/{id}/profile (public endpoint, no auth
 * required server-side; our axios instance attaches the token anyway).
 *
 * "Start chat" hits POST /private/chats {user_id} — idempotent, so tapping
 * it twice returns the same chat. The real chat screen arrives in Phase 4;
 * for now we confirm the chat id.
 */
export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setProfile(await getUserProfile(id));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onStartChat = async () => {
    if (!profile) return;
    setStartingChat(true);
    try {
      const chat = await chatApi.startChat({ user_id: Number(profile.id) });
      Alert.alert(
        "Chat ready",
        `Chat #${chat.id} with ${profile.name} is set up. The conversation screen lands in Phase 4.`,
      );
    } catch (e) {
      Alert.alert("Could not start chat", getApiErrorMessage(e));
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator style={styles.center} color={theme.colors.primary} />
      </Screen>
    );
  }

  if (error || !profile) {
    return (
      <Screen>
        <Text style={styles.errorBanner}>{error ?? "Profile not found."}</Text>
        <PrimaryButton title="Try again" onPress={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar
            uri={resolveImageUrl(profile.profile_image)}
            name={profile.name}
            size={110}
          />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          {profile.is_verified ? (
            <View style={styles.verifiedChip}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Bio</Text>
          <Text style={styles.bio}>
            {profile.bio?.trim() ? profile.bio : "No bio yet."}
          </Text>
        </View>

        <PrimaryButton
          title="Start chat"
          onPress={onStartChat}
          loading={startingChat}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    marginTop: theme.spacing.xxl,
  },
  content: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: "center",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  email: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  verifiedChip: {
    backgroundColor: "#E0E7FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: theme.spacing.sm,
  },
  verifiedText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
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
    marginBottom: theme.spacing.xs,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  errorBanner: {
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },
});
