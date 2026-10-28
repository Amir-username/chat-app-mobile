import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ChatMessage } from "@/hooks/usePrivateChat";
import { theme } from "@/theme";

interface ChatInputBarProps {
  /** Message currently being replied to (rendered as a bar above the input) */
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (content: string, replyTo: ChatMessage | null) => void;
  disabled?: boolean;
}

/**
 * Message composer: reply preview bar + multiline input + send button.
 * Server constraint: content is trimmed, 1–5000 chars (enforced here too).
 */
export function ChatInputBar({
  replyTo,
  onCancelReply,
  onSend,
  disabled,
}: ChatInputBarProps) {
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0 && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim(), replyTo);
    setText("");
  };

  return (
    <View style={styles.wrap}>
      {replyTo ? (
        <View style={styles.replyBar}>
          <View style={styles.replyAccent} />
          <View style={styles.replyTextWrap}>
            <Text style={styles.replyName} numberOfLines={1}>
              {replyTo.sender_name}
            </Text>
            <Text style={styles.replyContent} numberOfLines={1}>
              {replyTo.content}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} hitSlop={10}>
            <Text style={styles.replyCancel}>×</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message…"
          placeholderTextColor={theme.colors.textMuted}
          keyboardAppearance="dark"
          multiline
          maxLength={5000}
        />
        <Pressable
          onPress={submit}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendBtn,
            !canSend && styles.sendBtnDisabled,
            pressed && canSend && styles.sendBtnPressed,
          ]}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
  },
  replyAccent: {
    width: 3,
    height: "100%",
    minHeight: 28,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  replyTextWrap: {
    flex: 1,
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
  replyCancel: {
    fontSize: 20,
    color: theme.colors.textMuted,
    paddingHorizontal: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: theme.colors.text,
    maxHeight: 120,
  },
  sendBtn: {
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnPressed: {
    backgroundColor: theme.colors.primaryDark,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
