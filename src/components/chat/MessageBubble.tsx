import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "@/hooks/usePrivateChat";
import { formatTime } from "@/utils/datetime";
import { theme } from "@/theme";

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  /** Long-press opens the Reply / Delete action sheet */
  onLongPress: (message: ChatMessage) => void;
}

/**
 * Telegram-style chat bubble:
 *  - mine → right, indigo, white text · theirs → left, white, dark text
 *  - reply_to preview rendered as an inset block inside the bubble
 *  - footer: time + state (··· while pending, red note when failed)
 */
export function MessageBubble({
  message,
  isMine,
  onLongPress,
}: MessageBubbleProps) {
  const failed = message.state === "failed";
  const pending = message.state === "pending";

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <Pressable
        onLongPress={() => onLongPress(message)}
        delayLongPress={250}
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          failed && styles.bubbleFailed,
        ]}
      >
        {message.reply_to ? (
          <View
            style={[
              styles.replyBox,
              isMine ? styles.replyBoxMine : styles.replyBoxTheirs,
            ]}
          >
            <Text
              style={[styles.replyName, isMine && styles.replyTextLight]}
              numberOfLines={1}
            >
              {message.reply_to.sender_name}
            </Text>
            <Text
              style={[styles.replyContent, isMine && styles.replyTextLight]}
              numberOfLines={2}
            >
              {message.reply_to.content}
            </Text>
          </View>
        ) : null}

        <Text
          style={[
            styles.content,
            isMine && styles.contentMine,
            failed && styles.contentFailed,
          ]}
        >
          {message.content}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[styles.time, isMine && styles.timeMine]}>
            {formatTime(message.created_at)}
          </Text>
          {pending ? (
            <Text style={[styles.pendingMark, isMine && styles.timeMine]}>
              ···
            </Text>
          ) : null}
          {failed ? <Text style={styles.failedMark}>Not sent</Text> : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  rowTheirs: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: theme.radius.sm,
  },
  bubbleFailed: {
    backgroundColor: theme.colors.dangerBg,
  },
  replyBox: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs + 2,
    marginBottom: theme.spacing.xs,
    borderLeftWidth: 3,
  },
  replyBoxMine: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderLeftColor: "rgba(255,255,255,0.6)",
  },
  replyBoxTheirs: {
    backgroundColor: theme.colors.background,
    borderLeftColor: theme.colors.primary,
  },
  replyName: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  replyContent: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  replyTextLight: {
    color: "rgba(255,255,255,0.85)",
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.text,
  },
  contentMine: {
    color: "#FFFFFF",
  },
  contentFailed: {
    color: theme.colors.danger,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  timeMine: {
    color: "rgba(255,255,255,0.75)",
  },
  pendingMark: {
    fontSize: 11,
    marginLeft: 4,
    letterSpacing: 1,
  },
  failedMark: {
    fontSize: 11,
    color: theme.colors.danger,
    fontWeight: "600",
    marginLeft: 4,
  },
});
