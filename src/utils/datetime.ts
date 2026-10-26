/**
 * Time formatting helpers for chat UIs.
 * Timestamps arrive as ISO 8601 strings (UTC, e.g. "2025-07-05T12:00:00.123+00:00").
 */

function parseIso(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "14:32" — used on chat bubbles. */
export function formatTime(iso: string): string {
  const d = parseIso(iso);
  if (!d) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Chat list rows: "14:32" today · "Mon" within the last week · "2025/07/05" older.
 */
export function formatChatTimestamp(iso: string): string {
  const d = parseIso(iso);
  if (!d) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(iso);

  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
