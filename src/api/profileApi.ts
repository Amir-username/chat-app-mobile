import { api } from "./client";
import type { ProfileResponse, UpdateProfileRequest } from "@/types/api";

/** Minimal shape matching ImagePicker.Asset from expo-image-picker */
export interface ImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB — enforced server-side too

/** Client-side mirror of the backend's upload rules (the API returns 400 otherwise). */
export function validateImageAsset(asset: ImageAsset): void {
  if (asset.mimeType && !ALLOWED_MIME_TYPES.includes(asset.mimeType)) {
    throw new Error("Unsupported file type. Allowed: jpg, png, gif, webp");
  }
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE) {
    throw new Error("File too large (max 5 MB)");
  }
}

/** GET /auth/search?q= — case-insensitive partial name match (limit ≤ 100, default 20) */
export async function searchUsers(
  q: string,
  limit = 20,
): Promise<ProfileResponse[]> {
  const { data } = await api.get<ProfileResponse[]>("/auth/search", {
    params: { q, limit },
  });
  return data;
}

/** GET /auth/me/profile — the authenticated user's full profile */
export async function getMyProfile(): Promise<ProfileResponse> {
  const { data } = await api.get<ProfileResponse>("/auth/me/profile");
  return data;
}

/**
 * PATCH /auth/me/profile — update name and/or bio.
 * ⚠ The API returns 400 "No fields to update" when BOTH fields are null —
 * make sure at least one is set (disable the Save button otherwise).
 */
export async function updateMyProfile(
  body: UpdateProfileRequest,
): Promise<ProfileResponse> {
  const { data } = await api.patch<ProfileResponse>("/auth/me/profile", body);
  return data;
}

/** GET /auth/users/{id}/profile — public endpoint (no auth required) */
export async function getUserProfile(
  userId: number | string,
): Promise<ProfileResponse> {
  const { data } = await api.get<ProfileResponse>(
    `/auth/users/${userId}/profile`,
  );
  return data;
}

/**
 * POST /auth/me/profile-image — multipart upload (jpg/png/gif/webp, ≤ 5 MB).
 * Pass the asset picked with expo-image-picker, after validateImageAsset().
 */
export async function uploadProfileImage(
  asset: ImageAsset,
): Promise<ProfileResponse> {
  validateImageAsset(asset);

  const form = new FormData();
  // React Native's FormData accepts the { uri, name, type } file shape
  form.append("file", {
    uri: asset.uri,
    name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
    type: asset.mimeType ?? "image/jpeg",
  } as unknown as Blob);

  const { data } = await api.post<ProfileResponse>(
    "/auth/me/profile-image",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      // If your axios version ever sends a missing boundary error, remove the
      // header above — React Native then adds the boundary automatically.
    },
  );
  return data;
}
