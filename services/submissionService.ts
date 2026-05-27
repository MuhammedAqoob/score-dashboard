import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { analyzeResponse } from "@/services/analysisService";
import { CreateSubmissionInput } from "@/types/submission";

const SUBMISSIONS_COLLECTION = "submissions";

function getSubmissionsCollectionRef() {
  return collection(db, SUBMISSIONS_COLLECTION);
}

export async function createSubmission(input: CreateSubmissionInput) {
  const responseText = input.responseText.trim();

  if (!responseText) {
    throw new Error("Submission cannot be empty.");
  }

  const analysis = analyzeResponse(responseText);

  const submissionDocument = await addDoc(getSubmissionsCollectionRef(), {
    username: input.username,
    promptId: input.promptId,
    promptVersion: input.promptVersion,
    responseText,
    submittedAt: serverTimestamp(),
    analyzed: analysis.analyzed,
    scores: analysis.scores,
    overallScore: analysis.overallScore,
    score: analysis.overallScore,
  });

  return submissionDocument.id;
}
