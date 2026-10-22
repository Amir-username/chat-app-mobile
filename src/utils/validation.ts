/**
 * Client-side form validation — mirrors the backend's server-side rules
 * (FastAPI returns 422 for violations; we catch the obvious ones locally
 * first for a snappier UX).
 *
 * Backend constraints (from the OpenAPI schema):
 *   email     — RFC-style format
 *   password  — 1–128 chars on login, 8–128 on register
 *   name      — 1–255 chars
 *   bio       — ≤ 2000 chars
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Email is required';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address';
  return null;
}

/** Generic password check — pass minLength=1 for login, 8 for register. */
export function validatePassword(value: string, minLength = 8): string | null {
  if (!value) return 'Password is required';
  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  if (value.length > 128) return 'Password must be at most 128 characters';
  return null;
}

/** Registration password — server enforces min 8 chars. */
export function validateNewPassword(value: string): string | null {
  return validatePassword(value, 8);
}

export function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Name is required';
  if (v.length > 255) return 'Name must be at most 255 characters';
  return null;
}

/** Optional field — only call this when bio is non-empty. */
export function validateBio(value: string): string | null {
  if (value.length > 2000) return 'Bio must be at most 2000 characters';
  return null;
}