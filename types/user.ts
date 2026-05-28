import { Timestamp } from "firebase/firestore";

export type UserStatus = "pending" | "approved" | "revoked" | "banned";

export type UserProfile = {
  username: string;
  password: string;
  score: number;
  approved: boolean;
  status?: UserStatus;
  bannedUntil?: Timestamp | null;
  banReason?: string | null;
  createdAt?: Timestamp;
  currentUid?: string;
};

export type UserProfileWithId = UserProfile & {
  id: string;
};
