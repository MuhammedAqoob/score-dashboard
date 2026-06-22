import {
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getEffectiveUserStatus, isBanExpired } from "@/services/moderationUtils";
import { UserProfile, UserProfileWithId } from "@/types/user";

/**
 * Auth migration (Firestore plaintext passwords -> Firebase Authentication).
 *
 * Identity model:
 *   - Firestore profile doc id : `users/{username}`          (unchanged)
 *   - Firebase Auth identity   : synthetic email + password
 *                                email = `${username}@scoreboard.internal`
 *   - Firestore profile doc    : stores `authUid` + `email`, NEVER `password`
 *
 * The public function names/signatures are preserved so that the existing
 * AuthContext does not need to change its call sites.
 *
 * Passwords are no longer stored in Firestore. The only plaintext read path is
 * the optional, opt-in legacy fallback in `migrateLegacyUserIfEligible`,
 * guarded by NEXT_PUBLIC_LEGACY_LOGIN_FALLBACK and intended to be removed once
 * the bulk migration script has processed every user.
 */

const SYNTHETIC_EMAIL_DOMAIN = "scoreboard.internal";

/** Opt-in only legacy fallback. Default OFF. */
const LEGACY_FALLBACK_ENABLED =
  process.env.NEXT_PUBLIC_LEGACY_LOGIN_FALLBACK === "true";

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function getUserProfileRef(username: string) {
  return doc(db, "users", normalizeUsername(username));
}

export function syntheticEmail(username: string): string {
  return `${normalizeUsername(username)}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

export function createDefaultUsername(uid: string) {
  return `player-${uid.slice(0, 6)}`;
}

export async function getUserProfileByUsername(
  username: string,
): Promise<UserProfileWithId | null> {
  const cleanUsername = normalizeUsername(username);
  const profileSnap = await getDoc(getUserProfileRef(cleanUsername));

  if (!profileSnap.exists()) {
    return null;
  }

  return {
    id: cleanUsername,
    ...(profileSnap.data() as UserProfile),
  };
}

export async function checkAndClearExpiredBan(username: string) {
  const cleanUsername = normalizeUsername(username);
  const profileSnap = await getDoc(getUserProfileRef(cleanUsername));

  if (!profileSnap.exists()) {
    return;
  }

  const profileData = profileSnap.data() as UserProfile;

  if (profileData.status !== "banned" || !isBanExpired(profileData.bannedUntil)) {
    return;
  }

  await updateDoc(getUserProfileRef(cleanUsername), {
    approved: true,
    status: "approved",
    bannedUntil: null,
    banReason: null,
  });
}

/**
 * Apply the existing ban/auto-approve status logic to a profile and persist it.
 * Behaviour preserved verbatim from the pre-migration implementation.
 */
async function applyLoginStatusEffects(
  username: string,
  profile: UserProfileWithId,
): Promise<UserProfileWithId> {
  const userStatus = getEffectiveUserStatus(profile);
  const shouldAutoApprove = userStatus !== "banned";

  if (shouldAutoApprove) {
    await updateDoc(getUserProfileRef(username), {
      approved: true,
      status: "approved",
    });

    return {
      ...profile,
      approved: true,
      status: "approved",
    };
  }

  return profile;
}

/**
 * Sign up a brand-new user.
 * Creates the Firebase Auth account (source of truth for the password) and the
 * Firestore profile doc (no `password` field).
 *
 * Signature preserved: (username, password, currentUid?) — `currentUid` is
 * accepted for backward-compatibility but ignored (identity is now keyed by
 * the Firebase Auth account's own uid, stored as `authUid`).
 */
export async function createUserProfile(
  username: string,
  password: string,
  // Kept for call-site compatibility with AuthContext; intentionally unused.
  _currentUid?: string,
): Promise<UserProfileWithId> {
  const cleanUsername = normalizeUsername(username);
  const email = syntheticEmail(cleanUsername);

  const profileRef = getUserProfileRef(cleanUsername);
  const existing = await getDoc(profileRef);
  if (existing.exists()) {
    throw new Error("That username is already taken.");
  }

  // Firebase Auth is the source of truth for the password.
  const credential: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  const profile: UserProfile = {
    username: cleanUsername,
    score: 0,
    approved: true,
    status: "approved",
    bannedUntil: null,
    banReason: null,
    email,
    authUid: credential.user.uid,
  };

  await setDoc(profileRef, {
    ...profile,
    createdAt: serverTimestamp(),
  });

  return {
    id: cleanUsername,
    ...profile,
  };
}

/**
 * TEMPORARY — legacy first-login migration.
 *
 * Only runs when NEXT_PUBLIC_LEGACY_LOGIN_FALLBACK === "true" (default OFF).
 * If the username has a Firestore doc that still carries a legacy `password`
 * field, and that field matches the supplied password, this provisions the
 * Firebase Auth account, records `authUid`/`email`, and REMOVES the `password`
 * field from Firestore. Subsequent logins then take the normal Firebase Auth
 * path and never touch plaintext again.
 *
 * Isolation:
 *   - Single entry point (`loginUserProfile`), guarded by the flag.
 *   - No other code references legacy plaintext.
 *   - Remove this function + the flag once all users are migrated.
 */
async function migrateLegacyUserIfEligible(
  cleanUsername: string,
  password: string,
): Promise<UserProfileWithId> {
  const profile = await getUserProfileByUsername(cleanUsername);

  if (!profile || !profile.password) {
    throw new Error("Username or password is incorrect.");
  }

  if (profile.password !== password) {
    throw new Error("Username or password is incorrect.");
  }

  // Provision the Firebase Auth account with the same password.
  const credential = await createUserWithEmailAndPassword(
    auth,
    syntheticEmail(cleanUsername),
    password,
  );

  const profileRef = getUserProfileRef(cleanUsername);
  await updateDoc(profileRef, {
    email: syntheticEmail(cleanUsername),
    authUid: credential.user.uid,
    // Remove the legacy plaintext password field for good.
    password: null,
  });

  const { password: _removed, ...profileWithoutPassword } = profile;
  return {
    ...profileWithoutPassword,
    email: syntheticEmail(cleanUsername),
    authUid: credential.user.uid,
  };
}

/**
 * Log a user in using Firebase Authentication (synthetic email + password).
 *
 * Signature preserved: (username, password, currentUid?).
 *
 * Flow:
 *   1. Sign in with Firebase Auth.
 *   2. Load the profile by username, apply ban/auto-approve effects.
 *   3. On `auth/user-not-found`, optionally fall back to the legacy
 *      one-time migration (flag-gated, default OFF).
 */
export async function loginUserProfile(
  username: string,
  password: string,
  // Kept for call-site compatibility with AuthContext; intentionally unused.
  _currentUid?: string,
): Promise<UserProfileWithId> {
  const cleanUsername = normalizeUsername(username);

  try {
    await signInWithEmailAndPassword(
      auth,
      syntheticEmail(cleanUsername),
      password,
    );
  } catch (error) {
    const isUserMissing = isAuthUserNotFoundError(error);

    if (isUserMissing && LEGACY_FALLBACK_ENABLED) {
      // One-time legacy migration path. Default OFF.
      return migrateLegacyUserIfEligible(cleanUsername, password);
    }

    if (isUserMissing) {
      throw new Error("Username or password is incorrect.");
    }

    throw new Error(
      error instanceof Error ? error.message : "Could not sign in.",
    );
  }

  const profile = await getUserProfileByUsername(cleanUsername);

  if (!profile) {
    throw new Error("Username or password is incorrect.");
  }

  return applyLoginStatusEffects(cleanUsername, profile);
}

export async function updateUserProfile(
  username: string,
  data: Partial<Pick<UserProfile, "username">>,
) {
  const cleanUsername = normalizeUsername(username);

  if (data.username) {
    const nextUsername = normalizeUsername(data.username);

    if (nextUsername !== cleanUsername) {
      throw new Error("Changing usernames is not supported yet.");
    }
  }

  await updateDoc(getUserProfileRef(cleanUsername), data);
}

/**
 * Detects the Firebase Auth "no such user" error across error shapes.
 */
function isAuthUserNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: string }).code;
  return (
    code === "auth/user-not-found" ||
    code === "auth/email-not-found" ||
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials"
  );
}
