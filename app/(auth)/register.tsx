import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getApiErrorMessage, getFieldErrors } from "@/api/errors";
import { validateEmail, validatePassword } from "@/utils/validation";
import { theme } from "@/theme";

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
            error={fieldErrors.email}
          />
          <TextField
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={fieldErrors.password}
          />

          <PrimaryButton
            title="Sign in"
            onPress={onSubmit}
            loading={submitting}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>No account yet? </Text>
            <Link href="/(auth)/register" style={styles.footerLink}>
              Create one
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  errorBanner: {
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorBannerText: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.xl,
  },
  footerText: { color: theme.colors.textMuted, fontSize: 14 },
  footerLink: { color: theme.colors.primary, fontSize: 14, fontWeight: "600" },
});
