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
import {
  validateBio,
  validateEmail,
  validateName,
  validateNewPassword,
} from "@/utils/validation";
import { theme } from "@/theme";

/**
 * Register — Dark Glow edition.
 * Same flow & validation as before; glass fields with icons,
 * glowing CTA, bottom pill to switch to login.
 */
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
          <View style={styles.logoChip}>
            <Ionicons name="chatbubbles" size={30} color="#FFFFFF" />
          </View>
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
            icon={
              <Ionicons
                name="person-outline"
                size={19}
                color={theme.colors.textMuted}
              />
            }
          />
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
            placeholder="8–128 characters"
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

          <Link href="/(auth)/login" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.switchPill,
                pressed && styles.switchPillPressed,
              ]}
            >
              <Text style={styles.switchText}>
                Already have an account?{" "}
                <Text style={styles.switchBold}>Sign in</Text>
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
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },
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
    lineHeight: 21,
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
    marginTop: 38, // extra breathing room below the CTA
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
