import { Timestamp } from "firebase/firestore";

export type Prompt = {
  title: string;
  content: string;
  version: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type PromptWithId = Prompt & {
  id: string;
};

export type CreatePromptInput = {
  title: string;
  content: string;
  version: number;
};
