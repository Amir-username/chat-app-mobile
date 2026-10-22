import { api } from "./client";
import type {
  LoginJsonRequest,
  MessageOut,
  RegisterRequest,
  TokenOut,
  UserOut,
  UserResponse,
} from "@/types/api";

/**
 * POST /auth/login/json — JSON login for programmatic clients.
 * (The form-urlencoded /auth/login is the OAuth2 variant used by Swagger's
 * "Authorize" button — mobile clients only need this one.)
 */
export async function login(body: LoginJsonRequest): Promise<TokenOut> {
  const { data } = await api.post<TokenOut>("/auth/login/json", body);
  return data;
}

/**
 * POST /auth/register — create an account.
 * Validation: password 8–128 chars · name 1–255 chars · bio ≤ 2000 chars.
 * Violations come back as 422 — parse with getApiErrorMessage().
 */
export async function register(body: RegisterRequest): Promise<UserResponse> {
  const { data } = await api.post<UserResponse>("/auth/register", body);
  return data;
}

/**
 * POST /auth/refresh — exchange a refresh token for a NEW token pair.
 * Called automatically by the 401 interceptor — you rarely need this directly.
 */
export async function refresh(refreshToken: string): Promise<TokenOut> {
  const { data } = await api.post<TokenOut>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return data;
}

/** POST /auth/logout — revoke both tokens server-side (then clear local storage). */
export async function logout(refreshToken?: string): Promise<MessageOut> {
  const { data } = await api.post<MessageOut>(
    "/auth/logout",
    refreshToken ? { refresh_token: refreshToken } : undefined,
  );
  return data;
}

/** GET /auth/me — current authenticated user (use for session hydration). */
export async function me(): Promise<UserOut> {
  const { data } = await api.get<UserOut>("/auth/me");
  return data;
}
