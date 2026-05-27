import {
  NextOrObserver,
  User,
  onAuthStateChanged,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function subscribeToAuthState(callback: NextOrObserver<User>) {
  return onAuthStateChanged(auth, callback);
}

export async function createAnonymousSession() {
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export async function resetAnonymousSession() {
  await signOut(auth);
}
