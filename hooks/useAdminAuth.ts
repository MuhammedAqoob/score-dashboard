"use client";

import { useCallback, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ADMIN_EMAIL, isAdminEmail, logoutAdmin } from "@/services/adminSession";

/**
 * Admin authorization (post-migration).
 *
 * Admin status is derived from the live Firebase Auth user: a session is admin
 * iff the signed-in user's email equals NEXT_PUBLIC_ADMIN_EMAIL. The email is
 * part of the Firebase-signed token, so it cannot be forged by the client.
 *
 * This hook subscribes to Firebase auth state directly so it stays in sync with
 * AuthContext without creating a circular import.
 */
export function useAdminAuth() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = isAdminEmail(userEmail);

  const login = useCallback(
    async (email: string, password: string) => {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );

      if (!isAdminEmail(credential.user.email)) {
        // Not the allowlisted admin — sign straight back out and reject.
        await signOut(auth);
        throw new Error(
          ADMIN_EMAIL
            ? `This account is not an administrator. Expected ${ADMIN_EMAIL}.`
            : "Admin access is not configured (NEXT_PUBLIC_ADMIN_EMAIL).",
        );
      }

      // Eagerly commit the admin email to state so `isAdmin` flips to true
      // immediately. Without this, `isAdmin` stays false until the async
      // onAuthStateChanged callback fires — long enough for
      // AdminProtectedRoute to redirect back to /admin/login on a successful
      // sign-in (the "dashboard flashes then logs out" bug).
      setUserEmail(credential.user.email ?? null);
      logoutAdmin();
    },
    [],
  );

  const logout = useCallback(() => {
    logoutAdmin();
    return signOut(auth);
  }, []);

  return {
    isAdmin,
    loading,
    login,
    logout,
  };
}
