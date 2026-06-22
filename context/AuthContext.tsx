"use client";

import { User } from "firebase/auth";
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createAnonymousSession,
  resetAnonymousSession,
  subscribeToAuthState,
} from "@/services/anonymousAuth";
import { logoutAdmin } from "@/services/adminSession";
import {
  clearSessionUsername,
  getSessionUsername,
  setSessionUsername,
} from "@/services/sessionCookie";
import {
  createUserProfile,
  getUserProfileByUsername,
  loginUserProfile,
  updateUserProfile,
} from "@/services/userService";
import { UserProfile, UserProfileWithId } from "@/types/user";

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfileWithId | null;
  loading: boolean;
  error: string;
  signup: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, "username">>) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

/**
 * Auth migration: identity now flows from the signed-in Firebase user.
 *
 *  - A signed-in user with a synthetic email (`*@scoreboard.internal`) is a
 *    regular app user; we load their profile by the username encoded in the
 *    email.
 *  - The session cookie (`scoreboard_username`) is kept only as a profile-load
 *    hint for the brief window before the auth listener resolves; it is NOT a
 *    trust boundary.
 *  - Anonymous visitors still get an anonymous session (browsing/leaderboard).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const initializeSession = async (user: User | null) => {
      try {
        setLoading(true);
        setError("");

        const resolvedUser = user ?? (await createAnonymousSession());

        if (!active) {
          return;
        }

        setFirebaseUser(resolvedUser);

        // Only synthetic-email accounts map to an app profile. Anonymous
        // visitors (no email) have no profile — they can browse only.
        if (!resolvedUser.email) {
          setProfile(null);
          return;
        }

        const usernameFromEmail = deriveUsernameFromEmail(resolvedUser.email);
        const storedUsername = getSessionUsername();
        const username = usernameFromEmail ?? storedUsername;

        if (!username) {
          setProfile(null);
          return;
        }

        const loadedProfile = await getUserProfileByUsername(username);

        if (!active) {
          return;
        }

        setProfile(loadedProfile);
      } catch (syncError) {
        if (!active) {
          return;
        }

        setProfile(null);
        setError(
          syncError instanceof Error
            ? syncError.message
            : "Could not initialize session.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = subscribeToAuthState((user) => {
      initializeSession(user);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signup = useCallback(
    async (username: string, password: string) => {
      // createUserProfile provisions the Firebase Auth account + Firestore doc.
      // The auth-state listener will fire and reload the profile; we also set
      // local state eagerly for snappy UX.
      const createdProfile = await createUserProfile(username, password);
      logoutAdmin();

      setSessionUsername(createdProfile.username);
      setProfile(createdProfile);
    },
    [],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const loggedInProfile = await loginUserProfile(username, password);
      logoutAdmin();

      setSessionUsername(loggedInProfile.username);
      setProfile(loggedInProfile);
    },
    [],
  );

  const logout = useCallback(async () => {
    clearSessionUsername();
    setProfile(null);
    await resetAnonymousSession();
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<Pick<UserProfile, "username">>) => {
      if (!profile) {
        throw new Error("No profile is logged in.");
      }

      await updateUserProfile(profile.username, data);
      setProfile({
        ...profile,
        ...data,
      });
    },
    [profile],
  );

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      loading,
      error,
      signup,
      login,
      logout,
      updateProfile,
    }),
    [firebaseUser, profile, loading, error, signup, login, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Extracts the username from a synthetic email (`alice@scoreboard.internal`). */
function deriveUsernameFromEmail(email: string): string | null {
  const match = email.match(/^(.+)@scoreboard\.internal$/);
  return match ? match[1] : null;
}
