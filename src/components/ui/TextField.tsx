import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { theme } from "@/theme";

interface TextFieldProps extends TextInputProps {
  label: string;
  /** Inline error shown under the input (from client validation or API 422) */
  error?: string | null;
}

/** Labeled text input with inline error display. */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, style, ...rest }, ref) => {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, error ? styles.inputError : null, style]}
          {...rest}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  },
);
TextField.displayName = "TextField";

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    marginTop: theme.spacing.xs,
  },
});
