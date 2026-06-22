import { Timestamp } from "firebase/firestore";

export type UserStatus = "pending" | "approved" | "revoked" | "banned";

export type UserProfile = {
  username: string;
  /**
   * Legacy field retained ONLY for the one-time migration of pre-Firebase-Auth
   * users. New accounts and migrated accounts no longer write this field.
   * It is never compared after migration. See services/userService.ts.
   * @deprecated removed during Firebase Auth migration.
   */
  password?: string;
  score: number;
  approved: boolean;
  status?: UserStatus;
  bannedUntil?: Timestamp | null;
  banReason?: string | null;
  createdAt?: Timestamp;
  /** @deprecated kept for backward-compatibility; superseded by `authUid`. */
  currentUid?: string;
  /** Synthetic email used by Firebase Auth (e.g. `alice@scoreboard.internal`). */
  email?: string;
  /** Firebase Auth UID backing this profile. */
  authUid?: string;
};

export type UserProfileWithId = UserProfile & {
  id: string;
};
