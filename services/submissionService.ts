import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { analyzeResponse } from "@/services/analysisService";
import { getCurrentDayKey } from "@/services/dayKey";
import { fetchActivePrompt } from "@/services/promptService";
import { CreateSubmissionInput } from "@/types/submission";

const SUBMISSIONS_COLLECTION = "submissions";

function getSubmissionsCollectionRef() {
  return collection(db, SUBMISSIONS_COLLECTION);
}

function getSubmissionId(username: string, dayKey: string) {
  return `${encodeURIComponent(username)}_${dayKey}`;
}

export async function getSubmissionForDay(username: string, dayKey: string) {
  const submissionRef = doc(
    db,
    SUBMISSIONS_COLLECTION,
    getSubmissionId(username, dayKey),
  );
  const submissionSnap = await getDoc(submissionRef);

  return submissionSnap.exists() ? submissionSnap.data() : null;
}

export async function createSubmission(input: CreateSubmissionInput) {
  const responseText = input.responseText.trim();

  if (!responseText) {
    throw new Error("Submission cannot be empty.");
  }

  const activePrompt = await fetchActivePrompt();
  const dayKey = getCurrentDayKey();

  if (!activePrompt) {
    throw new Error("No active prompt is available.");
  }

  if (
    input.promptId !== activePrompt.id ||
    input.promptVersion !== activePrompt.version
  ) {
    throw new Error("Prompt version is outdated. Refresh and try again.");
  }

  const submissionRef = doc(
    db,
    SUBMISSIONS_COLLECTION,
    getSubmissionId(input.username, dayKey),
  );
  const existingSubmission = await getDoc(submissionRef);

  if (existingSubmission.exists()) {
    throw new Error("You already submitted today. Come back tomorrow.");
  }

  const analysis = analyzeResponse(responseText);

  await setDoc(submissionRef, {
    username: input.username,
    promptId: activePrompt.id,
    promptVersion: activePrompt.version,
    dayKey,
    responseText,
    scores: analysis.scores,
    aiReportedScore: analysis.aiReportedScore,
    calculatedScore: analysis.calculatedScore,
    validated: analysis.validated,
    submittedAt: serverTimestamp(),
  });

  return {
    id: submissionRef.id,
    calculatedScore: analysis.calculatedScore,
    aiReportedScore: analysis.aiReportedScore,
  };
}

export async function getSubmissionCount() {
  const submissionsSnapshot = await getDocs(getSubmissionsCollectionRef());
  return submissionsSnapshot.size;
}
