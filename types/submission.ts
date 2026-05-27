import { Timestamp } from "firebase/firestore";
import { ScoreMap } from "@/types/score";

export type Submission = {
  username: string;
  promptId: string;
  promptVersion: number;
  responseText: string;
  submittedAt?: Timestamp;
  analyzed: boolean;
  score: number;
  scores: ScoreMap;
  overallScore: number;
};

export type CreateSubmissionInput = {
  username: string;
  promptId: string;
  promptVersion: number;
  responseText: string;
};
