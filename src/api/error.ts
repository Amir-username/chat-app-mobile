import axios from "axios";
import type { ApiValidationError } from "@/types/api";

/**
 * Human-readable message from any error thrown by the API layer.
 * Handles:
 *  - FastAPI 422 validation errors  (detail: array of {loc, msg, type})
 *  - FastAPI HTTPException errors   (detail: string, e.g. "Chat not found")
 *  - timeout / network errors
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const payload: unknown = error.response?.data;

    if (payload && typeof payload === "object" && "detail" in payload) {
      const detail = (payload as ApiValidationError | { detail: string })
        .detail;

      // 422 → array of field errors
      if (Array.isArray(detail)) {
        return (detail as ApiValidationError["detail"])
          .map((item) => {
            const field = item.loc.filter((part) => part !== "body").join(".");
            return field ? `${field}: ${item.msg}` : item.msg;
          })
          .join("\n");
      }
      // HTTPException → string detail ("Invalid or expired token", "Cannot chat with yourself", ...)
      if (typeof detail === "string") return detail;
    }

    if (error.code === "ECONNABORTED")
      return "Request timed out. Please try again.";
    if (status) return `Request failed with status ${status}.`;
    return "Network error. Check your connection and try again.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

/**
 * Map a FastAPI 422 response to inline form errors: { fieldName: message }.
 * e.g. { email: "value is not a valid email address", password: "..." }
 * Returns {} for non-validation errors — fall back to getApiErrorMessage().
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {};
  const payload: unknown = error.response?.data;
  if (!payload || typeof payload !== "object" || !("detail" in payload))
    return {};

  const detail = (payload as ApiValidationError).detail;
  if (!Array.isArray(detail)) return {};

  const out: Record<string, string> = {};
  for (const item of detail) {
    // loc is like ["body", "email"] — keep the field name (strings only)
    const field = item.loc
      .filter((part) => typeof part === "string" && part !== "body")
      .pop();
    if (field && !(field in out)) out[field] = item.msg;
  }
  return out;
}
