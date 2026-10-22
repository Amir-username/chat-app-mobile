/// <reference types="expo/types" />

// Explicit typing for the env vars used by this app.
// Expo inlines EXPO_PUBLIC_* values at build time (defined in .env).
declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_API_URL?: string;
    readonly EXPO_PUBLIC_WS_URL?: string;
  }
}
