import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getChatMessages, sendMessage } from "@/api/chatApi";
import { getApiErrorMessage } from "@/api/errors";
import type {
  ChatDetailResponse,
  MessageResponse,
  ReplyPreview,
} from "@/types/api";
import { PrivateChatSocket, type SocketStatus } from "@/ws/privateSocket";

const PAGE_SIZE = 30;

/**
 * A message as rendered — real server messages plus optimistic ones.
 * Real:    key = String(server id), state undefined
 * Pending: key = "tmp-…", state 'pending'   (still awaiting the REST 201)
 * Failed:  state 'failed'                    (REST rejected → red bubble)
 */
export interface ChatMessage extends MessageResponse {
  key: string;
  state?: "pending" | "failed";
}

function toChatMessage(m: MessageResponse): ChatMessage {
  return { ...m, key: String(m.id) };
}

/** Newest-first ordering for the inverted FlatList. */
function compareDesc(a: ChatMessage, b: ChatMessage): number {
  const ta = Date.parse(a.created_at) || 0;
  const tb = Date.parse(b.created_at) || 0;
  if (tb !== ta) return tb - ta;
  return Number(b.id) - Number(a.id);
}

/**
 * Everything the private chat screen needs:
 *
 *  - initial page via REST (GET /private/chats/{id}?offset=0&limit=30)
 *  - live frames via PrivateChatSocket (history / message / system)
 *  - optimistic send via REST with pending → sent/failed transitions,
 *    de-duplicated against the sender's own WS echo (by id, plus a
 *    content-match fallback for replacing the pending copy)
 *  - "load older" offset paging for the inverted list (onEndReached)
 *  - offset bookkeeping: every NEW server message that lands in the list
 *    shifts the server-side window by one (frames received while the socket
 *    is down can still cause minor drift — dedupe by id keeps the UI sane)
 */
export function usePrivateChat(chatId: number) {
  const myId = useAuthStore((s) => s.user?.id ?? null);

  const [chat, setChat] = useState<ChatDetailResponse | null>(null);
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserImage, setOtherUserImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [presence, setPresence] = useState<string | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [sending, setSending] = useState(false);

  const myIdRef = useRef<number | string | null>(myId);
  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  const offsetRef = useRef(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const presenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mergeServerMessages = useCallback((incoming: MessageResponse[]) => {
    if (incoming.length === 0) return;
    const fresh: ChatMessage[] = [];
    for (const m of incoming) {
      const key = String(m.id);
      if (seenIdsRef.current.has(key)) continue;
      seenIdsRef.current.add(key);
      fresh.push(toChatMessage(m));
    }
    if (fresh.length === 0) return;
    setMessages((prev) => [...prev, ...fresh].sort(compareDesc));
  }, []);

  /**
   * Live 'message' frame or REST send echo.
   * Own messages usually arrive as a WS broadcast echo — if a pending
   * optimistic copy with the same content is still waiting, replace it
   * (that turns the spinner into a normal bubble); otherwise append.
   */
  const handleIncomingMessage = useCallback((msg: MessageResponse) => {
    const key = String(msg.id);
    if (seenIdsRef.current.has(key)) return; // already rendered

    const isMine = String(msg.sender_id) === String(myIdRef.current ?? "");
    seenIdsRef.current.add(key);
    offsetRef.current += 1; // window shifted: this message occupies a newest slot

    setMessages((prev) => {
      if (isMine) {
        const idx = prev.findIndex(
          (m) => m.state === "pending" && m.content === msg.content,
        );
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = { ...msg, key };
          return next;
        }
      }
      if (prev.some((m) => m.key === key)) return prev;
      return [...prev, toChatMessage(msg)].sort(compareDesc);
    });
  }, []);

  // Initial REST load + socket lifecycle (re-runs per chat)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFatal(null);
    setMessages([]);
    setPresence(null);
    setHasMoreOlder(false);
    seenIdsRef.current = new Set();
    offsetRef.current = 0;

    void (async () => {
      try {
        const res = await getChatMessages(chatId, 0, PAGE_SIZE);
        if (cancelled) return;
        setChat(res.chat);
        setOtherUserName(res.other_user_name);
        setOtherUserImage(res.other_user_image ?? null);
        mergeServerMessages(res.messages);
        offsetRef.current = res.messages.length;
        setHasMoreOlder(res.messages.length === PAGE_SIZE);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const socket = new PrivateChatSocket(chatId, {
      onFrame: (frame) => {
        const data = frame as Record<string, unknown>;
        const type = data.type;

        if (type === "history") {
          mergeServerMessages((data.messages ?? []) as MessageResponse[]);
        } else if (type === "message") {
          handleIncomingMessage(data as unknown as MessageResponse);
        } else if (type === "system") {
          setPresence(String(data.content ?? ""));
          if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current);
          presenceTimerRef.current = setTimeout(() => setPresence(null), 6_000);
        } else if (type === "fatal") {
          const code = Number(data.code);
          setFatal(
            code === 4003
              ? "You are not a participant in this chat."
              : "This chat does not exist.",
          );
        }
      },
      onStatusChange: (s) => setStatus(s),
    });
    socket.connect();

    return () => {
      cancelled = true;
      if (presenceTimerRef.current) clearTimeout(presenceTimerRef.current);
      socket.disconnect();
    };
  }, [chatId, mergeServerMessages, handleIncomingMessage]);

  const send = useCallback(
    async (
      content: string,
      reply?: { id: number; preview: ReplyPreview | null },
    ): Promise<boolean> => {
      const text = content.trim();
      if (!text || text.length > 5000) return false;

      const tmpKey = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: ChatMessage = {
        id: -1,
        chat_id: chatId,
        sender_id: (myIdRef.current ?? -1) as number,
        sender_name: "Me",
        content: text,
        reply_to: reply?.preview ?? null,
        created_at: new Date().toISOString(),
        state: "pending",
        key: tmpKey,
      };
      setMessages((prev) => [optimistic, ...prev].sort(compareDesc));
      setSending(true);

      try {
        const real = await sendMessage(chatId, {
          content: text,
          reply_to_id: reply?.id ?? null,
        });
        const realKey = String(real.id);
        if (!seenIdsRef.current.has(realKey)) {
          seenIdsRef.current.add(realKey);
          offsetRef.current += 1;
        }
        // Turn the pending bubble into the real message (WS echo may beat us
        // to it — replacing by tmpKey is idempotent either way)
        setMessages((prev) =>
          prev.map((m) => (m.key === tmpKey ? { ...real, key: realKey } : m)),
        );
        return true;
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.key === tmpKey ? { ...m, state: "failed" as const } : m,
          ),
        );
        return false;
      } finally {
        setSending(false);
      }
    },
    [chatId],
  );

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMoreOlder || loading) return;
    setLoadingOlder(true);
    try {
      const res = await getChatMessages(chatId, offsetRef.current, PAGE_SIZE);
      offsetRef.current += res.messages.length;
      setHasMoreOlder(res.messages.length === PAGE_SIZE);
      mergeServerMessages(res.messages);
    } catch {
      // Non-fatal — scrolling again retries
    } finally {
      setLoadingOlder(false);
    }
  }, [chatId, hasMoreOlder, loading, loadingOlder, mergeServerMessages]);

  const removeFailed = useCallback((key: string) => {
    setMessages((prev) => prev.filter((m) => m.key !== key));
  }, []);

  return {
    chat,
    otherUserName,
    otherUserImage,
    messages,
    status,
    presence,
    fatal,
    loading,
    error,
    loadingOlder,
    hasMoreOlder,
    sending,
    send,
    loadOlder,
    removeFailed,
  };
}
