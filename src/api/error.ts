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
