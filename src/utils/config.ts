/**
 * Central app configuration — reads Expo env vars.
 * EXPO_PUBLIC_* values are inlined at build time from .env.
 */

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://chat-service.fastapicloud.dev";

/** Used in Phase 4/5 for the WebSocket connections */
export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? "wss://chat-service.fastapicloud.dev";

/**
 * The API returns image paths RELATIVE (e.g. "/uploads/profile_images/1_ab12cd.jpg"
 * for profile_image / other_user_image). Convert to absolute URLs before passing
 * to <Image source={{ uri }} />.
 */
export function resolveImageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path}`;
}
