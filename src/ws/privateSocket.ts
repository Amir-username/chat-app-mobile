import axios from "axios";
import { API_URL, WS_URL } from "@/utils/config";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/api/tokenStorage";
import { notifyUnauthorized } from "@/api/client";

/** Connection lifecycle as surfaced in the chat header/banner. */
export type SocketStatus =
  | "idle"
  | "connecting"
  | "online"
  | "reconnecting"
  | "closed"
  | "error";

interface PrivateSocketHandlers {
  /** Every parsed JSON frame from the server (history / message / system). */
  onFrame: (frame: unknown) => void;
  onStatusChange?: (status: SocketStatus) => void;
}

const BACKOFF_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

/**
 * WebSocket connection to ONE private chat:
 *   wss://…/private/ws/chat/{chat_id}?token=<access_token>
 *
 * Reconnect policy (mirrors the backend close codes from private_chat.py):
 *  - 4001 invalid/expired token → refresh the pair once, reconnect with the
 *    fresh access token; if the refresh fails → clear tokens + notify the
 *    auth layer (logout) and stop.
 *  - 4003 not a participant / 4004 chat not found → permanent. No reconnect;
 *    a synthetic {type:'fatal', code} frame is emitted for the UI.
 *  - anything else (network drop, server deploy) → exponential backoff
 *    1s → 2s → 5s → 10s → 30s (reset after a successful open).
 */
export class PrivateChatSocket {
  private chatId: number;
  private handlers: PrivateSocketHandlers;
  private ws: WebSocket | null = null;
  private attempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private status: SocketStatus = "idle";

  constructor(chatId: number, handlers: PrivateSocketHandlers) {
    this.chatId = chatId;
    this.handlers = handlers;
  }

  private setStatus(next: SocketStatus): void {
    if (this.status === next) return;
    this.status = next;
    this.handlers.onStatusChange?.(next);
  }

  connect(): void {
    if (this.disposed) return;
    this.setStatus("connecting");
    void this.open();
  }

  private async open(): Promise<void> {
    const token = await getAccessToken();
    if (this.disposed) return;

    if (!token) {
      // Nothing to authenticate with — session is gone
      this.setStatus("error");
      notifyUnauthorized();
      return;
    }

    const url = `${WS_URL}/private/ws/chat/${this.chatId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.attempt = 0; // reset backoff after a successful open
      this.setStatus("online");
    };

    ws.onmessage = (event: WebSocketMessageEvent) => {
      try {
        this.handlers.onFrame(JSON.parse(String(event.data)));
      } catch {
        // Malformed frame — ignore
      }
    };

    ws.onclose = (event: WebSocketCloseEvent) => {
      if (this.disposed) return;
      void this.handleClose(event.code);
    };

    ws.onerror = () => {
      // onclose always follows onerror — nothing to do here
    };
  }

  private async handleClose(code: number): Promise<void> {
    if (this.disposed) return;

    if (code === 4003 || code === 4004) {
      this.setStatus("error");
      this.handlers.onFrame({ type: "fatal", code });
      return;
    }

    if (code === 4001) {
      // Access token expired mid-session → refresh once, then reconnect
      const fresh = await refreshAccessToken();
      if (this.disposed) return;
      if (!fresh) {
        this.setStatus("error");
        notifyUnauthorized(); // refresh token dead → force logout
        return;
      }
      this.scheduleReconnect();
      return;
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    const delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)];
    this.attempt += 1;
    this.setStatus("reconnecting");
    this.retryTimer = setTimeout(() => {
      void this.open();
    }, delay);
  }

  /**
   * NOTE: we deliberately do NOT send messages over the socket — the backend
   * persists WS-sent messages too, and we already send via REST
   * (POST /private/chats/{id}/messages). Sending through both would duplicate
   * every message. The socket is receive-only for us.
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    this.disposed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.ws) {
      // 1000 = normal closure → server broadcasts "<name> went offline"
      try {
        this.ws.close(1000, "client left");
      } catch {
        // already closing
      }
      this.ws = null;
    }
    this.setStatus("closed");
  }
}

/**
 * Refresh the token pair with a bare axios call — deliberately bypasses the
 * `api` instance interceptors (same pattern as client.ts). Returns the new
 * access token, or null if the refresh token is missing/revoked.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { timeout: 15_000 },
    );
    await saveTokens(data);
    return data.access_token as string;
  } catch {
    await clearTokens();
    return null;
  }
}
