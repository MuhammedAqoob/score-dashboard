import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Submission } from "@/types/submission";

const SUBMISSIONS_COLLECTION = "submissions";

function getSubmittedAtMillis(submission: Submission) {
  return submission.submittedAt?.toMillis() ?? 0;
}

export function subscribeToUserSubmissions(
  username: string,
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
        .filter((submission) => submission.username === username)
        .sort(
          (first, second) =>
            getSubmittedAtMillis(second) - getSubmittedAtMillis(first),
        );

      onUpdate(submissions);
    },
    onError,
  );
}
