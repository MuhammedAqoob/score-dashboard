import { Timestamp } from "firebase/firestore";

export type AdminActionType =
  | "approve_user"
  | "revoke_user"
  | "ban_user"
  | "unban_user"
  | "edit_score"
  | "delete_submission"
  | "restore_submission"
  | "prompt_update";

export type AdminLog = {
  id?: string;
  actionType: AdminActionType;
  targetUsername: string;
  adminUsername: string;
  details: string;
  createdAt?: Timestamp;
};
