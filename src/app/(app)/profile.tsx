import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
} from "@/api/profileApi";
import { getApiErrorMessage } from "@/api/errors";
import type { ProfileResponse, UpdateProfileRequest } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { validateBio, validateName } from "@/utils/validation";
import { resolveImageUrl } from "@/utils/config";
import { theme } from "@/theme";

/**
 * My profile — view + edit.
 *
 * Endpoints used:
 *  - GET  /auth/me/profile          → ProfileResponse
 *  - PATCH /auth/me/profile         → ⚠ API returns 400 "No fields to update"
 *    when BOTH name and bio are null. We always send `name`, so this can't
 *    happen. Sending bio: null explicitly clears it.
 *  - POST /auth/me/profile-image    → multipart upload (jpg/png/gif/webp ≤ 5 MB),
 *    returns the updated ProfileResponse with the new relative image path.
 */
export default function MyProfileScreen() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Avatar upload
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await getMyProfile());
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startEditing = () => {
    if (!profile) return;
    setName(profile.name);
    setBio(profile.bio ?? "");
    setFieldErrors({});
    setEditing(true);
  };

  const onSave = async () => {
    const nameError = validateName(name);
    const bioError = bio.trim() ? validateBio(bio) : null;
    if (nameError || bioError) {
      setFieldErrors({
        ...(nameError ? { name: nameError } : {}),
        ...(bioError ? { bio: bioError } : {}),
      });
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateProfileRequest = {
        // Always send name (1–255 chars) → both-null 400 quirk can never trigger
        name: name.trim(),
        // Empty bio explicitly clears it server-side (bio: null)
        bio: bio.trim() ? bio.trim() : null,
      };
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      setEditing(false);
    } catch (e) {
      // 422 field errors → inline; anything else → banner
      Alert.alert("Could not save", getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onChangePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to change your profile photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const updated = await uploadProfileImage({
        uri: asset.uri,
        fileName: asset.fileName ?? null,
        mimeType: asset.mimeType ?? null,
        fileSize: asset.fileSize ?? null,
      });
      setProfile(updated);
      Alert.alert("Done", "Profile photo updated.");
    } catch (e) {
      Alert.alert("Upload failed", getApiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator style={styles.center} color={theme.colors.primary} />
      </Screen>
    );
  }

  if (error || !profile) {
    return (
      <Screen>
        <Text style={styles.errorBanner}>
          {error ?? "Could not load profile."}
        </Text>
        <PrimaryButton title="Try again" onPress={() => void load()} />
      </Screen>
    );
  }

  if (editing) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            error={fieldErrors.name}
            maxLength={255}
            autoCapitalize="words"
          />
          <TextField
            label="Bio"
            value={bio}
            onChangeText={setBio}
            error={fieldErrors.bio}
            placeholder="Tell people a bit about yourself…"
            multiline
            maxLength={2000}
            style={styles.bioInput}
          />
          <PrimaryButton
            title="Save changes"
            onPress={onSave}
            loading={saving}
          />
          <Pressable
            style={styles.textButton}
            onPress={() => setEditing(false)}
            disabled={saving}
          >
            <Text style={styles.textButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar
            uri={resolveImageUrl(profile.profile_image)}
            name={profile.name}
            size={110}
          />
          <Pressable onPress={onChangePhoto} disabled={uploading}>
            <Text style={styles.changePhoto}>
              {uploading ? "Uploading…" : "Change photo"}
            </Text>
          </Pressable>
          {uploading ? (
            <ActivityIndicator
              style={styles.uploadSpinner}
              color={theme.colors.primary}
            />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Name</Text>
          <Text style={styles.cardValue}>{profile.name}</Text>

          <Text style={styles.cardLabel}>Email</Text>
          <Text style={styles.cardValue}>{profile.email}</Text>

          <Text style={styles.cardLabel}>Bio</Text>
          <Text style={[styles.cardValue, styles.bioText]}>
            {profile.bio?.trim() ? profile.bio : "No bio yet."}
          </Text>
        </View>

        <PrimaryButton title="Edit profile" onPress={startEditing} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    marginTop: theme.spacing.xxl,
  },
  content: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: "center",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  changePhoto: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: 14,
    marginTop: theme.spacing.md,
  },
  uploadSpinner: {
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  bioText: {
    lineHeight: 22,
    marginBottom: 0,
  },
  bioInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  textButton: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  textButtonText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
  errorBanner: {
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },
});
