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
import {
  validateBio,
  validateEmail,
  validateName,
  validateNewPassword,
} from "@/utils/validation";
import { theme } from "@/theme";

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitError(null);

    // Client-side mirror of the server rules (password 8–128, name 1–255, bio ≤ 2000)
    const errors: Record<string, string> = {};
    const nameError = validateName(name);
    if (nameError) errors.name = nameError;
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const passwordError = validateNewPassword(password);
    if (passwordError) errors.password = passwordError;
    const bioError = bio.trim() ? validateBio(bio) : null;
    if (bioError) errors.bio = bioError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        bio: bio.trim(),
      });
      // register() auto-logins → (auth)/_layout redirects into the app
    } catch (err) {
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Your display name is what other users will see when chatting with
            you.
          </Text>

          {submitError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          ) : null}

          <TextField
            label="Display name"
            placeholder="Alice"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            error={fieldErrors.name}
          />
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
            placeholder="8–128 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={fieldErrors.password}
          />
          <TextField
            label="Bio (optional)"
            placeholder="A few words about you"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            error={fieldErrors.bio}
          />

          <PrimaryButton
            title="Create account"
            onPress={onSubmit}
            loading={submitting}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" style={styles.footerLink}>
              Sign in
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
