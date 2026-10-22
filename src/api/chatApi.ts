import { api } from "./client";
import type {
  ChatDetailResponse,
  ChatListItem,
  ChatWithMessagesResponse,
  MessageResponse,
  SendMessageRequest,
  StartChatRequest,
} from "@/types/api";

/**
 * POST /private/chats — start (or return the existing) private chat with a user.
 * Idempotent: if a chat already exists between the two users it is returned.
 * Errors: 400 "Cannot chat with yourself" · 404 "User not found" · 401
 */
export async function startChat(
  body: StartChatRequest,
): Promise<ChatDetailResponse> {
  const { data } = await api.post<ChatDetailResponse>("/private/chats", body);
  return data;
}

/**
 * GET /private/chats — all my chats with last-message preview.
 * ⚠ Sorted by chat CREATION date, not last-message time.
 */
export async function listMyChats(): Promise<ChatListItem[]> {
  const { data } = await api.get<ChatListItem[]>("/private/chats");
  return data;
}

/**
 * GET /private/chats/{chat_id}?offset&limit — chat details + messages.
 * ⚠ `messages` is returned OLDEST-first (render with an inverted FlatList and
 * increase `offset` to page OLDER messages). limit: 1–200 (default 50).
 * Errors: 403 "Not a participant in this chat" · 404 "Chat not found"
 */
export async function getChatMessages(
  chatId: number,
  offset = 0,
  limit = 50,
): Promise<ChatWithMessagesResponse> {
  const { data } = await api.get<ChatWithMessagesResponse>(
    `/private/chats/${chatId}`,
    {
      params: { offset, limit },
    },
  );
  return data;
}

/**
 * POST /private/chats/{chat_id}/messages — persist + send a message.
 * content: 1–5000 chars (trimmed server-side) · reply_to_id must belong to the
 * same chat (else 400). The server pushes the message to the recipient via
 * WebSocket if they're online — the sender's own echo only comes back over WS.
 */
export async function sendMessage(
  chatId: number,
  body: SendMessageRequest,
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>(
    `/private/chats/${chatId}/messages`,
    body,
  );
  return data;
}
