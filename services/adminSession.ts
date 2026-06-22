/**
 * Admin authorization model (post-migration).
 *
 * The admin is a REAL Firebase Authentication account whose email matches the
 * allowlist below. Authoritativeness comes from Firebase Auth:
 *   - the email is part of the Firebase-signed ID token, so it cannot be
 *     forged by the client;
 *   - knowing the admin email grants nothing — the password is the secret,
 *     held by Firebase Auth, never by the app.
 *
 * This replaces the previous insecure scheme that compared against a
 * NEXT_PUBLIC_PASSWORD and stored `admin=true` in localStorage.
 *
 * `NEXT_PUBLIC_ADMIN_EMAIL` is a NON-SECRET identifier (configurable).
 *
 * NOTE: the live admin state lives in hooks/useAdminAuth.ts (derived from the
 * Firebase user). This module only exposes pure helpers + the logoutAdmin
 * stub kept for call-site compatibility.
 */
export const ADMIN_EMAIL =
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim().toLowerCase();

export function isAdminEmail(email?: string | null): boolean {
  if (!ADMIN_EMAIL || !email) {
    return false;
  }

  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function getAdminEmail() {
  return ADMIN_EMAIL;
}

/**
 * Clears any client-side admin UI state. Kept as a helper for call-site
 * compatibility (AuthContext calls this on user login/signup). Admin status is
 * now derived solely from the live Firebase user, so there is nothing stored.
 */
export function logoutAdmin() {
  // Intentional no-op: admin status is derived from the live Firebase user.
}
