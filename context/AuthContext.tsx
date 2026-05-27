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
import {
  createUserProfile,
  getUserProfileByUsername,
  loginUserProfile,
  updateUserProfile,
} from "@/services/userService";
import {
  clearSessionUsername,
  getSessionUsername,
  setSessionUsername,
} from "@/services/sessionCookie";
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

        const anonymousUser = user ?? (await createAnonymousSession());
        const storedUsername = getSessionUsername();

        if (!active) {
          return;
        }

        setFirebaseUser(anonymousUser);

        if (!storedUsername) {
          setProfile(null);
          return;
        }

        const storedProfile = await getUserProfileByUsername(storedUsername);

        if (!active) {
          return;
        }

        setProfile(storedProfile);
      } catch (syncError) {
        if (!active) {
          return;
        }

        setFirebaseUser(null);
        setProfile(null);
        setError(
          syncError instanceof Error
            ? syncError.message
            : "Could not initialize anonymous session.",
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
      const anonymousUser = firebaseUser ?? (await createAnonymousSession());
      const createdProfile = await createUserProfile(
        username,
        password,
        anonymousUser.uid,
      );

      setFirebaseUser(anonymousUser);
      setProfile(createdProfile);
      setSessionUsername(createdProfile.username);
    },
    [firebaseUser],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const anonymousUser = firebaseUser ?? (await createAnonymousSession());
      const loggedInProfile = await loginUserProfile(
        username,
        password,
        anonymousUser.uid,
      );

      setFirebaseUser(anonymousUser);
      setProfile(loggedInProfile);
      setSessionUsername(loggedInProfile.username);
    },
    [firebaseUser],
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
