import { forwardRef, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme";

interface TextFieldProps extends TextInputProps {
  label: string;
  /** Inline error shown under the input (from client validation or API 422) */
  error?: string | null;
  /** Optional leading element (e.g. an Ionicons glyph) inside the field */
  icon?: ReactNode;
  /** With secureTextEntry: adds an eye button to toggle visibility */
  toggleable?: boolean;
}

/**
 * Dark "glass" text input:
 *  - translucent fill + hairline border, indigo focus ring w/ soft glow
 *  - optional leading icon and password reveal toggle
 *  - inline error styling for API 422 / client validation
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  (
    {
      label,
      error,
      icon,
      toggleable,
      style,
      multiline,
      secureTextEntry,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const [revealed, setRevealed] = useState(false);

    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.box,
            multiline && styles.boxMultiline,
            focused && styles.boxFocused,
            error ? styles.boxError : null,
          ]}
        >
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <TextInput
            ref={ref}
            {...rest}
            style={[styles.input, multiline && styles.inputMultiline, style]}
            placeholderTextColor={theme.colors.textMuted}
            keyboardAppearance="dark"
            multiline={multiline}
            secureTextEntry={secureTextEntry && !revealed}
            onFocus={(e) => {
              setFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              rest.onBlur?.(e);
            }}
          />
          {toggleable && secureTextEntry ? (
            <Pressable
              onPress={() => setRevealed((v) => !v)}
              hitSlop={8}
              style={styles.eye}
            >
              <Ionicons
                name={revealed ? "eye-off" : "eye"}
                size={20}
                color={theme.colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
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
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
  },
  boxMultiline: {
    alignItems: "flex-start",
  },
  boxFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primaryGlow,
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  boxError: {
    borderColor: theme.colors.danger,
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    paddingVertical: 13,
  },
  inputMultiline: {
    textAlignVertical: "top",
    paddingTop: 12,
  },
  eye: {
    marginLeft: 10,
    padding: 2,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 13,
    marginTop: theme.spacing.xs,
    marginLeft: 2,
  },
});
