import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { theme } from "@/theme";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  /** Shows a spinner and disables interaction */
  loading?: boolean;
  disabled?: boolean;
}

/** Solid primary action button with built-in loading state. */
export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm,
  },
  pressed: {
    backgroundColor: theme.colors.primaryDark,
  },
  disabled: {
    opacity: 0.6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
