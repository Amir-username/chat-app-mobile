/**
 * API types — mirrors the Chat API OpenAPI schemas (v1.0.0).
 * Source of truth: https://chat-service.fastapicloud.dev/openapi.json
 * Repo: https://github.com/Amir-username/chat-service
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** `POST /auth/login/json` and `POST /auth/refresh` → 200 */
export interface TokenOut {
  access_token: string;
  refresh_token: string;
  /** Always "bearer" */
  token_type: string;
  /** Access token lifetime in seconds (server default: 3600 = 60 min) */
  expires_in: number;
}

/** `POST /auth/login/json` request body */
export interface LoginJsonRequest {
  email: string;
  password: string;
}

/** `POST /auth/register` request body */
export interface RegisterRequest {
  email: string;
  /** 8–128 chars */
  password: string;
  /** 1–255 chars */
  name: string;
  /** Optional, ≤ 2000 chars */
  bio?: string | null;
}

/** `POST /auth/register` → 201 */
export interface UserResponse {
  id: number | string;
  email: string;
  name: string;
  bio?: string | null;
  profile_image?: string | null;
  is_active: boolean;
  is_verified: boolean;
}

/** `GET /auth/me` → 200 (admin user endpoints return this too) */
export interface UserOut {
  id: number | string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
}

/** `GET /auth/users` → 200 (admin only) — paginated user listing */
export interface UserListOut {
  items: UserOut[];
  total: number;
  offset: number;
  limit: number;
}

/** `POST /auth/logout` → 200 */
export interface MessageOut {
  message: string;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * `GET /auth/search`, `GET /auth/me/profile`, `GET /auth/users/{id}/profile` → 200
 */
export interface ProfileResponse {
  id: number | string;
  email: string;
  name: string;
  bio?: string | null;
  /** RELATIVE path, e.g. "/uploads/profile_images/1_ab12cd.jpg" — resolve with resolveImageUrl() */
  profile_image?: string | null;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
}

/** `PATCH /auth/me/profile` request body — ⚠ 400 if BOTH fields are null */
export interface UpdateProfileRequest {
  name?: string | null;
  bio?: string | null;
}

// ---------------------------------------------------------------------------
// Private chat
// ---------------------------------------------------------------------------

/**
 * `POST /private/chats` → 201 (also returned when a chat between the two
 * users already exists — the endpoint is idempotent).
 */
export interface ChatDetailResponse {
  id: number;
  user1_id: number;
  user2_id: number;
  /** ISO 8601 timestamp */
  created_at: string;
}

/** `POST /private/chats` request body */
export interface StartChatRequest {
  user_id: number;
}

/** `GET /private/chats` → 200 — sorted by chat CREATION date, not last message */
export interface ChatListItem {
  id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_image?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  created_at: string;
}

/** Telegram-style snippet of the message being replied to */
export interface ReplyPreview {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

/** Message shape used by both REST responses and WebSocket frames */
export interface MessageResponse {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  reply_to: ReplyPreview | null;
  /** ISO 8601 timestamp */
  created_at: string;
}

/** `POST /private/chats/{chat_id}/messages` request body (content: 1–5000 chars) */
export interface SendMessageRequest {
  content: string;
  /** Must belong to the same chat — otherwise 400 */
  reply_to_id?: number | null;
}

/**
 * `GET /private/chats/{chat_id}?offset&limit` → 200
 * ⚠ `messages` is returned OLDEST-first despite the API docstring.
 */
export interface ChatWithMessagesResponse {
  chat: ChatDetailResponse;
  messages: MessageResponse[];
  other_user_id: number;
  other_user_name: string;
  other_user_image?: string | null;
}

// ---------------------------------------------------------------------------
// Errors (FastAPI shapes)
// ---------------------------------------------------------------------------

/** One field error inside a FastAPI 422 response */
export interface ValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
}

/** FastAPI 422 validation error body */
export interface ApiValidationError {
  detail: ValidationErrorItem[];
}
