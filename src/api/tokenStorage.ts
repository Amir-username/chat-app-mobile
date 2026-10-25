import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { TokenOut } from "@/types/api";

/**
 * JWT storage:
 *  - Native (iOS/Android): expo-secure-store (iOS Keychain / Android Keystore)
 *  - Web: localStorage (expo-secure-store is native-only and throws on web)
 *
 * Same exported API — drop-in replacement, no other file changes.
 *
 * ⚠ Web note: localStorage is readable by any JS on the page (XSS exposure).
 * Fine for development / internal tools; prefer the native build for real use.
 */

const ACCESS_TOKEN_KEY = "chat.access_token";
const REFRESH_TOKEN_KEY = "chat.refresh_token";

const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/** Persist both tokens (after login or refresh — the server rotates the pair). */
export async function saveTokens(tokens: TokenOut): Promise<void> {
  await Promise.all([
    setItem(ACCESS_TOKEN_KEY, tokens.access_token),
    setItem(REFRESH_TOKEN_KEY, tokens.refresh_token),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY);
}

/** Wipe tokens (logout or unrecoverable session). */
export async function clearTokens(): Promise<void> {
  await Promise.all([
    deleteItem(ACCESS_TOKEN_KEY),
    deleteItem(REFRESH_TOKEN_KEY),
  ]);
}
