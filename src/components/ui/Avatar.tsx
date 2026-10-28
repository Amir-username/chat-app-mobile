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
 * Round avatar with an initials fallback (dark edition — subtle ring,
 * indigo-tinted fallback instead of the old light indigo-100).
 * Used by: search results, public profile, my profile, chats list.
 */
export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: theme.colors.borderSoft,
          backgroundColor: theme.colors.surface,
        }}
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
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: theme.colors.primaryLight,
    fontWeight: "700",
  },
});
