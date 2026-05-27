import { Timestamp } from "firebase/firestore";

export type Prompt = {
  title: string;
  content: string;
  version: number;
  active: boolean;
  createdAt?: Timestamp;
};

export type PromptWithId = Prompt & {
  id: string;
};

export type CreatePromptInput = {
  title: string;
  content: string;
  version: number;
  active?: boolean;
};
