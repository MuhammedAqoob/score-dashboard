import { Timestamp } from "firebase/firestore";
import { ScoreMap } from "@/types/score";

export type Submission = {
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
};

export type CreateSubmissionInput = {
  username: string;
  promptId: string;
  promptVersion: number;
  responseText: string;
};
