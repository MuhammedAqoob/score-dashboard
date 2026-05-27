import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreatePromptInput, Prompt, PromptWithId } from "@/types/prompt";

const PROMPTS_COLLECTION = "prompts";
const ACTIVE_PROMPT_ID = "activePrompt";

function getActivePromptRef() {
  return doc(db, PROMPTS_COLLECTION, ACTIVE_PROMPT_ID);
}

export async function fetchActivePrompt() {
  const activePromptSnap = await getDoc(getActivePromptRef());

  if (!activePromptSnap.exists()) {
    return null;
  }

  return {
    id: activePromptSnap.id,
    ...(activePromptSnap.data() as Prompt),
  } satisfies PromptWithId;
}

export async function saveActivePrompt(input: CreatePromptInput) {
  const activePromptRef = getActivePromptRef();
  const activePromptSnap = await getDoc(activePromptRef);
  const title = input.title.trim();
  const content = input.content.trim();

  if (!title || !content) {
    throw new Error("Prompt title and content are required.");
  }

  await setDoc(
    activePromptRef,
    {
      title,
      content,
      version: input.version,
      createdAt:
        activePromptSnap.exists() && activePromptSnap.data().createdAt
          ? activePromptSnap.data().createdAt
          : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export const createPrompt = saveActivePrompt;
