import { collection, getDocs, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LeaderboardEntry } from "@/types/score";

const SUBMISSIONS_COLLECTION = "submissions";

type ScoreAccumulator = {
  total: number;
  count: number;
};

function buildLeaderboard(
  submissions: Array<Record<string, unknown>>,
  limitCount: number,
) {
  const scoresByUser = new Map<string, ScoreAccumulator>();

  submissions.forEach((submission) => {
    const username = String(submission.username ?? "");
    const validated = Boolean(submission.validated);
    const calculatedScore = Number(submission.calculatedScore ?? 0);

    if (!username || !validated) {
      return;
    }

    const current = scoresByUser.get(username) ?? { total: 0, count: 0 };

    scoresByUser.set(username, {
      total: current.total + calculatedScore,
      count: current.count + 1,
    });
  });

  return Array.from(scoresByUser.entries())
    .map<LeaderboardEntry>(([username, scoreData]) => ({
      username,
      averageScore: Math.round(scoreData.total / scoreData.count),
      submissionCount: scoreData.count,
    }))
    .sort((first, second) => second.averageScore - first.averageScore)
    .slice(0, limitCount);
}

export async function fetchLeaderboard(limitCount = 10) {
  const leaderboardSnapshot = await getDocs(
    query(collection(db, SUBMISSIONS_COLLECTION)),
  );

  return buildLeaderboard(
    leaderboardSnapshot.docs.map((submissionDocument) =>
      submissionDocument.data(),
    ),
    limitCount,
  );
}

export async function fetchUserAverageScore(username: string) {
  const submissionsSnapshot = await getDocs(
    query(collection(db, SUBMISSIONS_COLLECTION)),
  );
  const userSubmissions = submissionsSnapshot.docs
    .map((submissionDocument) => submissionDocument.data())
    .filter(
      (submission) =>
        submission.username === username && Boolean(submission.validated),
    );

  if (userSubmissions.length === 0) {
    return {
      averageScore: 0,
      submissionCount: 0,
    };
  }

  const totalScore = userSubmissions.reduce(
    (total, submission) => total + Number(submission.calculatedScore ?? 0),
    0,
  );

  return {
    averageScore: Math.round(totalScore / userSubmissions.length),
    submissionCount: userSubmissions.length,
  };
}

export function subscribeToLeaderboard(
  limitCount: number,
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    query(collection(db, SUBMISSIONS_COLLECTION)),
    (snapshot) => {
      onUpdate(
        buildLeaderboard(
          snapshot.docs.map((submissionDocument) => submissionDocument.data()),
          limitCount,
        ),
      );
    },
    onError,
  );
}
