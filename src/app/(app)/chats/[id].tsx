import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  type AlertButton,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { usePrivateChat, type ChatMessage } from "@/hooks/usePrivateChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { ReplyPreview } from "@/types/api";
import { theme } from "@/theme";

/**
 * Private conversation screen.
 *  - inverted FlatList (data is newest-first → newest bubble sits at the
 *    bottom, right above the input)
 *  - scrolling to the visual TOP triggers loadOlder() (offset paging)
 *  - long-press a bubble → Reply (or Delete for failed sends)
 *  - header shows the other user's name; banner shows connection status
 *    and "X is online / went offline" presence notices
 */
export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const chatId = Number(params.id);
  const myId = useAuthStore((s) => s.user?.id ?? null);

  const chat = usePrivateChat(
    Number.isFinite(chatId) && chatId > 0 ? chatId : 0,
  );
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  if (!Number.isFinite(chatId) || chatId <= 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorBanner}>Invalid chat.</Text>
      </SafeAreaView>
    );
  }

  const onBubbleLongPress = (m: ChatMessage) => {
    const buttons: AlertButton[] = [];
    if (m.id > 0) {
      buttons.push({ text: "Reply", onPress: () => setReplyTo(m) });
    }
    if (m.state === "failed") {
      buttons.push({
        text: "Delete",
        style: "destructive",
        onPress: () => chat.removeFailed(m.key),
      });
    }
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert(
      "",
      m.content.length > 80 ? `${m.content.slice(0, 80)}…` : m.content,
      buttons,
    );
  };

  const handleSend = (content: string, reply: ChatMessage | null) => {
    const canReply = reply && reply.id > 0;
    const preview: ReplyPreview | null = canReply
      ? {
          id: reply.id,
          sender_id: reply.sender_id,
          sender_name: reply.sender_name,
          content: reply.content,
          created_at: reply.created_at,
        }
      : null;
    void chat.send(content, canReply ? { id: reply.id, preview } : undefined);
    setReplyTo(null);
  };

  const statusText =
    chat.status === "connecting"
      ? "Connecting…"
      : chat.status === "reconnecting"
        ? "Reconnecting…"
        : chat.status === "error"
          ? "Connection error"
          : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Dynamic header title — the other user's name */}
      <Stack.Screen options={{ title: chat.otherUserName || "Chat" }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        {chat.fatal ? (
          <View style={styles.centerWrap}>
            <Text style={styles.errorBanner}>{chat.fatal}</Text>
            <PrimaryButton title="Go back" onPress={() => router.back()} />
          </View>
        ) : (
          <>
            {chat.error ? (
              <View style={styles.centerWrap}>
                <Text style={styles.errorBanner}>{chat.error}</Text>
                <Text style={styles.hint}>
                  Pull back and reopen this chat to retry.
                </Text>
              </View>
            ) : chat.loading ? (
              <View style={styles.centerWrap}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : (
              <>
                {statusText || chat.presence ? (
                  <View style={styles.banner}>
                    <Text
                      style={[
                        styles.bannerText,
                        chat.status === "error" && styles.bannerError,
                      ]}
                    >
                      {statusText ?? chat.presence}
                    </Text>
                  </View>
                ) : null}

                <FlatList
                  style={styles.flex}
                  data={chat.messages}
                  inverted
                  keyExtractor={(m) => m.key}
                  renderItem={({ item }) => (
                    <MessageBubble
                      message={item}
                      isMine={String(item.sender_id) === String(myId ?? "")}
                      onLongPress={onBubbleLongPress}
                    />
                  )}
                  onEndReached={() => void chat.loadOlder()}
                  onEndReachedThreshold={0.4}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  ListFooterComponent={
                    chat.loadingOlder ? (
                      <ActivityIndicator
                        style={styles.footerSpinner}
                        color={theme.colors.primary}
                      />
                    ) : null
                  }
                  ListEmptyComponent={
                    <Text style={styles.empty}>
                      No messages yet — say hello!
                    </Text>
                  }
                  contentContainerStyle={styles.listContent}
                />

                <ChatInputBar
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(null)}
                  onSend={handleSend}
                />
              </>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: theme.spacing.sm,
  },
  banner: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 6,
    alignItems: "center",
  },
  bannerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  bannerError: {
    color: theme.colors.danger,
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  footerSpinner: {
    marginVertical: theme.spacing.md,
  },
  empty: {
    textAlign: "center",
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xxl,
    fontSize: 14,
  },
  errorBanner: {
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    fontSize: 14,
    textAlign: "center",
  },
});
