import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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

export async function createUserProfile(
  username: string,
  password: string,
  currentUid: string,
) {
  const cleanUsername = normalizeUsername(username);
  const profileRef = getUserProfileRef(cleanUsername);
  const existingProfile = await getDoc(profileRef);

  if (existingProfile.exists()) {
    throw new Error("That username is already taken.");
  }

  const profile: UserProfile = {
    username: cleanUsername,
    password,
    score: 0,
    approved: false,
    currentUid,
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

  await updateDoc(getUserProfileRef(cleanUsername), {
    currentUid,
  });

  return {
    ...profile,
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
