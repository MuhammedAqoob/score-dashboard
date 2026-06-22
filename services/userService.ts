import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getEffectiveUserStatus, isBanExpired } from "@/services/moderationUtils";
import { UserProfile } from "@/types/user";

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function getUserProfileRef(username: string) {
  return doc(db, "users", normalizeUsername(username));
}

export function createDefaultUsername(uid: string) {
  return `player-${uid.slice(0, 6)}`;
}

export async function getUserProfileByUsername(username: string) {
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

/** --------------------------------------------------------------
 *  NEW – Register a user using Firebase Email/Password.
 *  The UI still sends a *username* + *password*; we turn the username
 *  into a deterministic synthetic email (`${username}@scoreboard.internal`).
 * --------------------------------------------------------------- */
function syntheticEmail(username: string): string {
  return `${username}@scoreboard.internal`;
}

export async function registerWithEmail(
  username: string,
  password: string,
  // `currentUid` is kept for backward‑compatibility but no longer stored.
  currentUid?: string,
) {
  const cleanUsername = normalizeUsername(username);
  const email = syntheticEmail(cleanUsername);

  // 1️⃣ Create the Firebase Auth account (throws if email already exists)
  const cred: UserCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const uid = cred.user.uid;

  // 2️⃣ Write the Firestore profile (no password field)
  const profileRef = getUserProfileRef(cleanUsername);
  const existing = await getDoc(profileRef);
  if (existing.exists()) {
    // Should never happen because usernames are unique, but guard anyway.
    throw new Error("That username is already taken.");
  }

  const profile: UserProfile = {
    username: cleanUsername,
    // password omitted – source of truth is now Firebase Auth
    score: 0,
    approved: true,
    status: "approved",
    bannedUntil: null,
    banReason: null,
    email,
    authUid: uid,
    // currentUid is now obsolete; we keep it only for a short grace period.
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

export async function loginUserProfile(
  username: string,
  password: string,
  currentUid: string,
) {
  const cleanUsername = normalizeUsername(username);
  const profile = await getUserProfileByUsername(cleanUsername);

  if (!profile || profile.password !== password) {
    throw new Error("Username or password is incorrect.");
  }

  const userStatus = getEffectiveUserStatus(profile);
  const shouldAutoApprove = userStatus !== "banned";

  await updateDoc(getUserProfileRef(cleanUsername), {
    currentUid,
    ...(shouldAutoApprove
      ? { approved: true, status: "approved" }
      : {}),
  });

  return {
    ...profile,
    ...(shouldAutoApprove
      ? {
          approved: true,
          status: "approved" as const,
        }
      : {}),
    currentUid,
  };
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
