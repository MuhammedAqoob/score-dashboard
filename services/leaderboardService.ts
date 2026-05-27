import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LeaderboardEntry } from "@/types/score";

const SUBMISSIONS_COLLECTION = "submissions";

export async function fetchLeaderboard(limitCount = 10) {
  const leaderboardQuery = query(
    collection(db, SUBMISSIONS_COLLECTION),
    orderBy("overallScore", "desc"),
    limit(limitCount * 5),
  );
  const leaderboardSnapshot = await getDocs(leaderboardQuery);
  const bestScoresByUser = new Map<string, number>();

  leaderboardSnapshot.docs.forEach((submissionDocument) => {
    const data = submissionDocument.data();
    const username = String(data.username ?? "");
    const overallScore = Number(data.overallScore ?? 0);

    if (!username) {
      return;
    }

    const currentBest = bestScoresByUser.get(username);

    if (currentBest === undefined || overallScore > currentBest) {
      bestScoresByUser.set(username, overallScore);
    }
  });

  return Array.from(bestScoresByUser.entries()).map<LeaderboardEntry>(
    ([username, overallScore]) => ({
      username,
      overallScore,
    }),
  ).slice(0, limitCount);
}

export function subscribeToLeaderboard(
  limitCount: number,
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onError: (error: Error) => void,
) {
  const leaderboardQuery = query(
    collection(db, SUBMISSIONS_COLLECTION),
    orderBy("overallScore", "desc"),
    limit(limitCount * 5),
  );

  return onSnapshot(
    leaderboardQuery,
    (snapshot) => {
      const bestScoresByUser = new Map<string, number>();

      snapshot.docs.forEach((submissionDocument) => {
        const data = submissionDocument.data();
        const analyzed = Boolean(data.analyzed);
        const username = String(data.username ?? "");
        const overallScore = Number(data.overallScore ?? 0);

        if (!analyzed || !username) {
          return;
        }

        const currentBest = bestScoresByUser.get(username);

        if (currentBest === undefined || overallScore > currentBest) {
          bestScoresByUser.set(username, overallScore);
        }
      });

      onUpdate(
        Array.from(bestScoresByUser.entries())
          .map<LeaderboardEntry>(([username, overallScore]) => ({
            username,
            overallScore,
          }))
          .slice(0, limitCount),
      );
    },
    onError,
  );
}
