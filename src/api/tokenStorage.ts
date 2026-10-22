import * as SecureStore from "expo-secure-store";
import type { TokenOut } from "@/types/api";

/**
 * JWT storage backed by expo-secure-store (iOS Keychain / Android Keystore).
 * Never use AsyncStorage for tokens — they must survive app restarts but stay
 * out of reach of other apps and device backups.
 */

const ACCESS_TOKEN_KEY = "chat.access_token";
const REFRESH_TOKEN_KEY = "chat.refresh_token";

/** Persist both tokens (after login or refresh — the server rotates the pair). */
export async function saveTokens(tokens: TokenOut): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

/** Wipe tokens (logout or unrecoverable session). */
export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
