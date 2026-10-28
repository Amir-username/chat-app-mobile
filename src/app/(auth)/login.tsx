import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getApiErrorMessage, getFieldErrors } from "@/api/errors";
import { validateEmail, validatePassword } from "@/utils/validation";
import { theme } from "@/theme";

/**
 * Login — Dark Glow edition.
 * Glass fields with icons, glowing logo chip, error banner for
 * network/server failures and inline 422 field errors, bottom pill
 * to switch to register. Logic is unchanged.
 */
export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitError(null);

    // Client-side checks (server rules for login: email format, password 1–128)
    const errors: Record<string, string> = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const passwordError = validatePassword(password, 1);
    if (passwordError) errors.password = passwordError;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Success → (auth)/_layout redirects into the app automatically
    } catch (err) {
      // 422s map to inline field errors; everything else to the banner
      setFieldErrors(getFieldErrors(err));
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoChip}>
            <Ionicons name="chatbubbles" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue to your chats.
          </Text>

          {submitError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          ) : null}

          <TextField
            label="Email"
            placeholder="alice@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            error={fieldErrors.email}
            icon={
              <Ionicons
                name="mail-outline"
                size={19}
                color={theme.colors.textMuted}
              />
            }
          />
          <TextField
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            toggleable
            error={fieldErrors.password}
            icon={
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={theme.colors.textMuted}
              />
            }
          />

          <PrimaryButton
            title="Sign in"
            onPress={onSubmit}
            loading={submitting}
          />

          <Link href="/(auth)/register" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.switchPill,
                pressed && styles.switchPillPressed,
              ]}
            >
              <Text style={styles.switchText}>
                New here?{" "}
                <Text style={styles.switchBold}>Create an account</Text>
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center" },
  logoChip: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.35)",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primaryGlow,
        shadowOpacity: 0.6,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: theme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14.5,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    textAlign: "center",
  },
  errorBanner: {
    backgroundColor: theme.colors.dangerBg,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorBannerText: {
    color: theme.colors.danger,
    fontSize: 13.5,
    lineHeight: 19,
  },
  switchPill: {
    alignSelf: "center",
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  switchPillPressed: {
    backgroundColor: theme.colors.primarySoft,
  },
  switchText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  switchBold: {
    color: theme.colors.primaryLight,
    fontWeight: "700",
  },
});
