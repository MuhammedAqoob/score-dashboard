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
import {
  getEffectiveUserStatus,
  isUserCurrentlyBanned,
} from "@/services/moderationUtils";
import { fetchActivePrompt } from "@/services/promptService";
import { getUserProfileByUsername } from "@/services/userService";
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
  const userProfile = await getUserProfileByUsername(input.username);

  if (!activePrompt) {
    throw new Error("No active prompt is available.");
  }

  if (!userProfile) {
    throw new Error("Log in before submitting a response.");
  }

  const userStatus = getEffectiveUserStatus(userProfile);

  if (isUserCurrentlyBanned(userProfile)) {
    const until = userProfile.bannedUntil
      ? ` until ${userProfile.bannedUntil.toDate().toLocaleString()}`
      : "";
    throw new Error(`Your account is temporarily banned${until}.`);
  }

  if (userStatus === "pending") {
    throw new Error("Your account is pending approval.");
  }

  if (userStatus === "revoked") {
    throw new Error("Your account access has been revoked.");
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
    status: "active",
    submittedAt: serverTimestamp(),
  });

  return {
    id: submissionRef.id,
    calculatedScore: analysis.calculatedScore,
    aiReportedScore: analysis.aiReportedScore,
    scores: analysis.scores,
    validated: analysis.validated,
    submittedAt: new Date(),
    dayKey,
  };
}

export async function getSubmissionCount() {
  const submissionsSnapshot = await getDocs(getSubmissionsCollectionRef());
  return submissionsSnapshot.size;
}
