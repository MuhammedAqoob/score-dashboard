import { Timestamp } from "firebase/firestore";

export type ValidationOutcome = "success" | "failure";

export type ValidationEvent = {
  id?: string;
  username: string;
  promptId: string;
  promptVersion: number;
  dayKey: string;
  outcome: ValidationOutcome;
  reason?: string;
  createdAt?: Timestamp;
};
