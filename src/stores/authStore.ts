import { create } from 'zustand';
import { authApi, clearTokens, getRefreshToken, saveTokens, setOnUnauthorized } from '@/api';
import type { UserOut } from '@/types/api';

/**
 * Global auth state.
 *
 * Flow:
 *  - hydrate()   → called once at app start; validates the stored session
 *                  via GET /auth/me (a 401 is transparently refreshed by
 *                  the axios interceptor before this ever sees an error)
 *  - login()     → POST /auth/login/json → save tokens → GET /auth/me
 *  - register()  → POST /auth/register → auto-login with same credentials
 *                  (the register endpoint does NOT return tokens)
 *  - logout()    → POST /auth/logout (best-effort) → wipe tokens locally
 *
 * The 401 interceptor calls setOnUnauthorized() when the session becomes
 * unrecoverable (refresh expired/revoked) — we then force the app into the
 * unauthenticated state and the (app)/_layout redirects to login.
 */

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  bio?: string;
}

export type AuthStatus = 'idle' | 'hydrating' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: UserOut | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,

  hydrate: async () => {
    // Guard against double-runs (React StrictMode / fast refresh)
    if (get().status === 'hydrating' || get().status === 'authenticated') return;
    set({ status: 'hydrating' });

    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        set({ status: 'unauthenticated', user: null });
        return;
      }
      // If the access token is expired, the interceptor refreshes + retries
      // before this call rejects — the session survives cold starts.
      const user = await authApi.me();
      set({ status: 'authenticated', user });
    } catch {
      // Refresh also failed (interceptor already cleared tokens + fired
      // onUnauthorized) → send the user to login.
      set({ status: 'unauthenticated', user: null });
    }
  },

  login: async (email, password) => {
    const tokens = await authApi.login({ email, password });
    await saveTokens(tokens);
    const user = await authApi.me();
    set({ status: 'authenticated', user });
  },

  register: async (input) => {
    await authApi.register({
      name: input.name,
      email: input.email,
      password: input.password,
      bio: input.bio ? input.bio : null,
    });
    // Register returns no tokens → auto-login with the same credentials
    await get().login(input.email, input.password);
  },

  logout: async () => {
    try {
      const refreshToken = (await getRefreshToken()) ?? undefined;
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Best-effort: server may already be logged out — clear locally anyway
    }
    await clearTokens();
    set({ status: 'unauthenticated', user: null });
  },
}));

/** Refresh expired/revoked server-side → drop local session immediately. */
setOnUnauthorized(() => {
  useAuthStore.setState({ status: 'unauthenticated', user: null });
});