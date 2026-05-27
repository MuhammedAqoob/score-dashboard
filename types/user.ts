import { Timestamp } from "firebase/firestore";

export type UserProfile = {
  username: string;
  password: string;
  score: number;
  approved: boolean;
  createdAt?: Timestamp;
  currentUid?: string;
};

export type UserProfileWithId = UserProfile & {
  id: string;
};
