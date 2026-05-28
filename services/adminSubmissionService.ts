import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAdminLog } from "@/services/adminLogService";
import { Submission } from "@/types/submission";

const SUBMISSIONS_COLLECTION = "submissions";

function getSubmittedAtMillis(submission: Submission) {
  return submission.submittedAt?.toMillis() ?? 0;
}

export function subscribeToAdminSubmissions(
  onUpdate: (submissions: Submission[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    query(collection(db, SUBMISSIONS_COLLECTION)),
    (snapshot) => {
      const submissions = snapshot.docs
        .map((submissionDocument) => ({
          id: submissionDocument.id,
          ...(submissionDocument.data() as Submission),
        }))
        .sort(
          (first, second) =>
            getSubmittedAtMillis(second) - getSubmittedAtMillis(first),
        );

      onUpdate(submissions);
    },
    onError,
  );
}

export async function editSubmissionOverallScore(
  submission: Submission,
  nextScore: number,
) {
  if (!submission.id) {
    throw new Error("Submission id is missing.");
  }

  if (!Number.isFinite(nextScore) || nextScore < 0 || nextScore > 100) {
    throw new Error("Score must be between 0 and 100.");
  }

  await updateDoc(doc(db, SUBMISSIONS_COLLECTION, submission.id), {
    calculatedScore: Math.round(nextScore),
    editedByAdmin: true,
    editedAt: serverTimestamp(),
  });

  await createAdminLog({
    actionType: "edit_score",
    targetUsername: submission.username,
    details: `Overall score changed to ${Math.round(nextScore)}.`,
  });
}

export async function setSubmissionDeleted(
  submission: Submission,
  deleted: boolean,
) {
  if (!submission.id) {
    throw new Error("Submission id is missing.");
  }

  await updateDoc(doc(db, SUBMISSIONS_COLLECTION, submission.id), {
    status: deleted ? "deleted" : "active",
  });

  await createAdminLog({
    actionType: deleted ? "delete_submission" : "restore_submission",
    targetUsername: submission.username,
    details: deleted
      ? `Submission ${submission.id} soft deleted.`
      : `Submission ${submission.id} restored.`,
  });
}
