/**
 * Barrel — import the whole API layer from '@/api':
 *
 *   import { api, authApi, chatApi, getApiErrorMessage } from '@/api';
 */
export { api, setOnUnauthorized } from "./client";
export { getApiErrorMessage } from "./errors";
export {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from "./tokenStorage";
export * as authApi from "./authApi";
export * as profileApi from "./profileApi";
export * as chatApi from "./chatApi";
