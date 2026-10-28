import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { theme } from "@/theme";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  /** Shows a spinner and disables interaction */
  loading?: boolean;
  disabled?: boolean;
  /** 'primary' = glowing indigo CTA · 'danger' = subtle red (e.g. Sign out) */
  variant?: "primary" | "danger";
}

/** Glowing primary action button with built-in loading state. */
export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const isDanger = variant === "danger";
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        isDanger ? styles.buttonDanger : styles.buttonPrimary,
        isDisabled && styles.disabled,
        pressed &&
          !isDisabled &&
          (isDanger ? styles.pressedDanger : styles.pressed),
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isDanger ? theme.colors.danger : "#FFFFFF"} />
      ) : (
        <Text style={[styles.title, isDanger && styles.titleDanger]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primaryGlow,
        shadowOpacity: 0.55,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  buttonDanger: {
    backgroundColor: "rgba(239,68,68,0.14)",
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
  },
  pressed: {
    backgroundColor: theme.colors.primaryDark,
  },
  pressedDanger: {
    backgroundColor: "rgba(239,68,68,0.24)",
  },
  disabled: {
    opacity: 0.6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: "700",
  },
  titleDanger: {
    color: theme.colors.danger,
  },
});
