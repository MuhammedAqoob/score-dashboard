import { Timestamp } from "firebase/firestore";

export type Submission = {
  username: string;
  promptId: string;
  promptVersion: number;
  responseText: string;
  submittedAt?: Timestamp;
  analyzed: boolean;
  score: number;
};

export type CreateSubmissionInput = {
  username: string;
  promptId: string;
  promptVersion: number;
  responseText: string;
};
