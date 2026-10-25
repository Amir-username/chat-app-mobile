import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { searchUsers } from "@/api/profileApi";
import { getApiErrorMessage } from "@/api/errors";
import type { ProfileResponse } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { resolveImageUrl } from "@/utils/config";
import { theme } from "@/theme";

/**
 * User search — debounced GET /auth/search?q= (case-insensitive partial
 * name match). Tap a result to open their public profile.
 *
 * API notes:
 *  - q must be 1–100 chars; limit ≤ 100 (we request 20)
 *  - returns ProfileResponse[] (id, email, name, bio?, profile_image?, ...)
 */
export default function UsersScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false); // at least one search completed

  const debouncedQuery = useDebouncedValue(query.trim(), 350);

  useEffect(() => {
    const q = debouncedQuery;

    if (q.length === 0) {
      setResults([]);
      setSearched(false);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false; // ignore stale responses when the query changed
    setLoading(true);
    setError(null);

    searchUsers(q, 20)
      .then((data) => {
        if (cancelled) return;
        setResults(data);
        setSearched(true);
      })
      .catch((e) => {
        if (!cancelled) setError(getApiErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return (
    <Screen style={{ padding: 0 }}>
      <View style={styles.searchWrap}>
        <TextField
          label="Search users"
          placeholder="Type a name…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push(`/users/${item.id}`)}
          >
            <Avatar
              uri={resolveImageUrl(item.profile_image)}
              name={item.name}
              size={44}
            />
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowEmail} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={styles.spinner}
              color={theme.colors.primary}
            />
          ) : debouncedQuery.length > 0 && searched ? (
            <Text style={styles.empty}>
              No users found for “{debouncedQuery}”
            </Text>
          ) : (
            <Text style={styles.empty}>
              Start typing a name to find people on the platform.
            </Text>
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  searchInput: {
    height: 44,
  },
  errorBanner: {
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  rowPressed: {
    borderColor: theme.colors.primary,
  },
  rowText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  rowEmail: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: theme.colors.textMuted,
  },
  separator: {
    height: theme.spacing.sm,
  },
  spinner: {
    marginTop: theme.spacing.xxl,
  },
  empty: {
    textAlign: "center",
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xxl,
    marginHorizontal: theme.spacing.xl,
    fontSize: 14,
  },
});
