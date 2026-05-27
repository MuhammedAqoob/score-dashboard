import {
  DocumentData,
  QueryDocumentSnapshot,
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreatePromptInput, Prompt, PromptWithId } from "@/types/prompt";

const PROMPTS_COLLECTION = "prompts";

function getPromptsCollectionRef() {
  return collection(db, PROMPTS_COLLECTION);
}

function getPromptDocumentRef(promptId: string) {
  return doc(db, PROMPTS_COLLECTION, promptId);
}

function mapPromptDocument(
  promptDocument: QueryDocumentSnapshot<DocumentData>,
): PromptWithId {
  return {
    id: promptDocument.id,
    ...(promptDocument.data() as Prompt),
  };
}

export async function fetchActivePrompt() {
  const activePromptQuery = query(
    getPromptsCollectionRef(),
    where("active", "==", true),
    limit(1),
  );
  const activePromptSnapshot = await getDocs(activePromptQuery);
  const activePromptDocument = activePromptSnapshot.docs[0];

  if (!activePromptDocument) {
    return null;
  }

  return mapPromptDocument(activePromptDocument);
}

export async function deactivateActivePrompts() {
  const activePromptQuery = query(
    getPromptsCollectionRef(),
    where("active", "==", true),
  );
  const activePromptSnapshot = await getDocs(activePromptQuery);

  if (activePromptSnapshot.empty) {
    return;
  }

  const batch = writeBatch(db);

  activePromptSnapshot.docs.forEach((promptDocument) => {
    batch.update(promptDocument.ref, {
      active: false,
    });
  });

  await batch.commit();
}

export async function createPrompt(input: CreatePromptInput) {
  if (input.active) {
    await deactivateActivePrompts();
  }

  const promptDocument = await addDoc(getPromptsCollectionRef(), {
    title: input.title.trim(),
    content: input.content.trim(),
    version: input.version,
    active: input.active ?? false,
    createdAt: serverTimestamp(),
  });

  return promptDocument.id;
}

export async function activatePrompt(promptId: string) {
  await deactivateActivePrompts();

  await updateDoc(getPromptDocumentRef(promptId), {
    active: true,
  });
}
