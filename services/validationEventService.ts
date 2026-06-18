import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ValidationEvent, ValidationOutcome } from "@/types/validationEvent";

const VALIDATION_EVENTS_COLLECTION = "validationEvents";

type CreateValidationEventInput = {
  username: string;
  promptId: string;
  promptVersion: number;
  dayKey: string;
  outcome: ValidationOutcome;
  reason?: string;
};

function logValidationEventDebug(...values: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.warn(...values);
  }
}

export async function createValidationEvent(
  input: CreateValidationEventInput,
) {
  try {
    await addDoc(collection(db, VALIDATION_EVENTS_COLLECTION), {
      username: input.username,
      promptId: input.promptId,
      promptVersion: input.promptVersion,
      dayKey: input.dayKey,
      outcome: input.outcome,
      reason: input.reason ?? null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    logValidationEventDebug("[validation-events] could not record event", error);
  }
}

export function subscribeToValidationEvents(
  onUpdate: (events: ValidationEvent[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, VALIDATION_EVENTS_COLLECTION),
      orderBy("createdAt", "desc"),
    ),
    (snapshot) => {
      onUpdate(
        snapshot.docs.map((eventDocument) => ({
          id: eventDocument.id,
          ...(eventDocument.data() as ValidationEvent),
        })),
      );
    },
    onError,
  );
}
