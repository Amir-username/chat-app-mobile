import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "@/utils/config";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./tokenStorage";
import type { TokenOut } from "@/types/api";

/**
 * Axios instance for the Chat API.
 *
 * - Attaches `Authorization: Bearer <access_token>` to every request
 * - On 401: refreshes the token pair via `POST /auth/refresh`, queues any
 *   concurrent requests until the refresh completes, then retries them
 * - On refresh failure: clears tokens and fires the `onUnauthorized` callback
 *   (register it ONCE at app startup with `setOnUnauthorized(...)` to reset
 *   the auth store and navigate to the login screen)
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setOnUnauthorized(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  // NOTE: do NOT set a global Content-Type here — it breaks multipart uploads
  // (axios sets application/json automatically for object bodies).
});

// ---------------------------------------------------------------------------
// Request interceptor — attach the bearer token
// ---------------------------------------------------------------------------
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — transparent token refresh + request queue
// ---------------------------------------------------------------------------

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  for (const pending of failedQueue) {
    if (error) pending.reject(error);
    else pending.resolve(token as string);
  }
  failedQueue = [];
}

/** Endpoints that must never trigger a refresh (they would loop forever). */
const REFRESH_EXCLUDED_PATHS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/login/json",
  "/auth/register",
];

function setAuthHeader(config: AxiosRequestConfig, token: string): void {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${token}`);
  config.headers = headers;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    const excluded = REFRESH_EXCLUDED_PATHS.some((p) => url.includes(p));

    // Only intercept 401s from protected endpoints, and only once per request
    if (status !== 401 || !original || original._retry || excluded) {
      return Promise.reject(error);
    }
    original._retry = true;

    // A refresh is already in flight → queue this request behind it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            setAuthHeader(original, token);
            resolve(api(original));
          },
          reject,
        });
      });
    }

    // First 401 → refresh the token pair, then retry the original request
    isRefreshing = true;
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token stored");

      // Bare axios call ON PURPOSE: the refresh request itself must bypass
      // this interceptor (no Authorization header, no refresh loop).
      const { data } = await axios.post<TokenOut>(
        `${API_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { timeout: 15_000 },
      );

      await saveTokens(data); // server rotates BOTH tokens
      processQueue(null, data.access_token);

      setAuthHeader(original, data.access_token);
      return api(original);
    } catch (refreshError) {
      // Refresh failed → session is unrecoverable
      processQueue(refreshError, null);
      await clearTokens();
      onUnauthorized?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
