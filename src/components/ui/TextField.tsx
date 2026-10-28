import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  Animated,
  Easing,
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
 * Dark "glass" text input — Dark Glow focus edition:
 *  - translucent fill + hairline border
 *  - on focus: brighter indigo border, an animated 4px glow ring hugging the
 *    box, plus a soft diffuse halo fading out around it (mimics the
 *    `box-shadow: 0 0 0 4px rgba(99,102,241,.18)` spec from the HTML preview)
 *  - label brightens while focused; error state turns the whole glow red
 *  - optional leading icon and password reveal toggle
 *  - inline error styling for API 422 / client validation
 *
 * The ring/halo are real Views (not box-shadow) so the effect also renders on
 * Android and web, where shadow* props are ignored.
 */
export const TextField = forwardRef<
  ComponentRef<typeof TextInput>,
  TextFieldProps
>(
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

    // 0 → idle, 1 → glowing. Drives ring + halo fade in/out.
    const glow = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(glow, {
        toValue: focused ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        // opacity supports the native driver; on web fall back to JS
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }, [focused, glow]);

    const hasError = !!error;

    return (
      <View style={styles.wrap}>
        <Text
          style={[styles.label, focused && !hasError && styles.labelFocused]}
        >
          {label}
        </Text>

        <View style={styles.fieldArea}>
          {/* soft diffuse halo, fades in on focus */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              {
                opacity: glow,
                backgroundColor: hasError
                  ? "rgba(239,68,68,0.10)"
                  : "rgba(99,102,241,0.10)",
              },
            ]}
          />
          {/* crisp 4px glow ring hugging the input */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                opacity: glow,
                borderColor: hasError
                  ? "rgba(239,68,68,0.28)"
                  : "rgba(99,102,241,0.22)",
              },
            ]}
          />

          <View
            style={[
              styles.box,
              multiline && styles.boxMultiline,
              focused && styles.boxFocused,
              hasError ? styles.boxError : null,
            ]}
          >
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <TextInput
              ref={ref}
              {...rest}
              style={[styles.input, multiline && styles.inputMultiline, style]}
              placeholderTextColor={theme.colors.placeholder}
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
                  color={
                    focused ? theme.colors.primaryLight : theme.colors.textMuted
                  }
                />
              </Pressable>
            ) : null}
          </View>
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
  labelFocused: {
    color: theme.colors.primaryLight,
  },
  fieldArea: {
    position: "relative",
  },
  // soft diffuse aura — extends 12px beyond the box on every side
  halo: {
    position: "absolute",
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: theme.radius.md + 12,
  },
  // crisp ring hugging the box, 4px thick (box-shadow: 0 0 0 4px equivalent)
  ring: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 4,
    borderRadius: theme.radius.md + 4,
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
    borderColor: theme.colors.primaryLight,
    backgroundColor: theme.colors.primarySoft,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primaryGlow,
        shadowOpacity: 0.5,
        shadowRadius: 16,
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
