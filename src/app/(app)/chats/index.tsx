import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { listMyChats } from "@/api/chatApi";
import { getApiErrorMessage } from "@/api/errors";
import type { ChatListItem } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Screen } from "@/components/ui/Screen";
import { resolveImageUrl } from "@/utils/config";
import { formatChatTimestamp } from "@/utils/datetime";
import { theme } from "@/theme";

/**
 * Private chats list — GET /private/chats.
 * ⚠ Sorted by chat CREATION date (backend quirk), not by last message time —
 * the timestamp shown is last_message_at when present, else created_at.
 */
export default function ChatsScreen() {
  const router = useRouter();

  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setChats(await listMyChats());
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Re-fetch every time the screen regains focus (new chats, new messages)
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <FlatList
        data={chats}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push(`/chats/${item.id}`)}
          >
            <Avatar
              uri={resolveImageUrl(item.other_user_image)}
              name={item.other_user_name}
              size={48}
            />
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.other_user_name}
              </Text>
              <Text style={styles.rowPreview} numberOfLines={1}>
                {item.last_message?.trim()
                  ? item.last_message
                  : "No messages yet"}
              </Text>
            </View>
            <Text style={styles.rowTime}>
              {formatChatTimestamp(item.last_message_at ?? item.created_at)}
            </Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={styles.spinner}
              color={theme.colors.primary}
            />
          ) : (
            <Text style={styles.empty}>
              No conversations yet.{"\n"}Find someone in “Find people” and tap
              “Start chat”.
            </Text>
          )
        }
        contentContainerStyle={
          chats.length === 0 ? styles.listEmpty : styles.listContent
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  rowPressed: {
    borderColor: theme.colors.primary,
  },
  rowText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  rowPreview: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rowTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
  },
  separator: {
    height: theme.spacing.sm,
  },
  spinner: {
    marginTop: theme.spacing.xxl,
  },
  empty: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginHorizontal: theme.spacing.xl,
  },
});
