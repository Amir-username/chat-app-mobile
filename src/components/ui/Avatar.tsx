import { Image, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";

interface AvatarProps {
  /**
   * Absolute image URL. The API returns RELATIVE paths
   * (e.g. "/uploads/profile_images/1_ab12cd.jpg") — run resolveImageUrl()
   * on them before passing, otherwise pass null/undefined for the fallback.
   */
  uri?: string | null;
  /** Used to render the initials fallback when there is no image */
  name?: string | null;
  /** Diameter in px (default 48) */
  size?: number;
}

function initialsOf(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? (parts[1][0] ?? "") : "";
  return (first + second).toUpperCase();
}

/**
 * Round avatar with an initials fallback.
 * Used by: search results, public profile, my profile, home header.
 */
export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.34) }]}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: "#E0E7FF", // indigo-100 — tinted companion of theme.colors.primary
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
});
