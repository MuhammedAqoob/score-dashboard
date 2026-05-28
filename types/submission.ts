import { Timestamp } from "firebase/firestore";
import { ScoreMap } from "@/types/score";

export type Submission = {
  id?: string;
  username: string;
  promptId: string;
  promptVersion: number;
  dayKey: string;
  responseText: string;
  submittedAt?: Timestamp;
  scores: ScoreMap;
  aiReportedScore: number;
  calculatedScore: number;
  validated: boolean;
  status?: "active" | "deleted";
  editedByAdmin?: boolean;
  editedAt?: Timestamp;
};

export type CreateSubmissionInput = {
  username: string;
  promptId: string;
  promptVersion: number;
  responseText: string;
};
