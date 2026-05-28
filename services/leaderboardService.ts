import {
  Timestamp,
  collection,
  getDocs,
  onSnapshot,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getEffectiveSubmissionScore,
  isActiveValidatedSubmission,
  isApprovedUser,
} from "@/services/moderationUtils";
import { LeaderboardEntry } from "@/types/score";

const SUBMISSIONS_COLLECTION = "submissions";

type ScoreAccumulator = {
  total: number;
  count: number;
  topScore: number;
  dateAchieved?: Timestamp;
};

function isNewerTimestamp(first?: Timestamp, second?: Timestamp) {
  if (!first) {
    return false;
  }

  if (!second) {
    return true;
  }

  return first.toMillis() > second.toMillis();
}

function buildLeaderboard(
  submissions: Array<Record<string, unknown>>,
  limitCount: number,
  approvedUsernames?: Set<string>,
) {
  const scoresByUser = new Map<string, ScoreAccumulator>();

  submissions.forEach((submission) => {
    const username = String(submission.username ?? "");
    const calculatedScore = getEffectiveSubmissionScore(submission);

    if (
      !username ||
      !isActiveValidatedSubmission(submission) ||
      (approvedUsernames && !approvedUsernames.has(username))
    ) {
      return;
    }

    const submittedAt = submission.submittedAt as Timestamp | undefined;
    const current = scoresByUser.get(username) ?? {
      total: 0,
      count: 0,
      topScore: 0,
      dateAchieved: undefined,
    };
    const isHigherScore = calculatedScore > current.topScore;
    const isSameScoreButNewer =
      calculatedScore === current.topScore &&
      isNewerTimestamp(submittedAt, current.dateAchieved);

    scoresByUser.set(username, {
      total: current.total + calculatedScore,
      count: current.count + 1,
      topScore:
        isHigherScore || isSameScoreButNewer
          ? calculatedScore
          : current.topScore,
      dateAchieved:
        isHigherScore || isSameScoreButNewer
          ? submittedAt
          : current.dateAchieved,
    });
  });

  return Array.from(scoresByUser.entries())
    .map<LeaderboardEntry>(([username, scoreData]) => ({
      username,
      averageScore: Math.round(scoreData.total / scoreData.count),
      submissionCount: scoreData.count,
      topScore: scoreData.topScore,
      dateAchieved: scoreData.dateAchieved,
    }))
    .sort((first, second) => second.averageScore - first.averageScore)
    .slice(0, limitCount);
}

async function fetchApprovedUsernames() {
  const usersSnapshot = await getDocs(collection(db, "users"));

  return new Set(
    usersSnapshot.docs
      .map((userDocument) => userDocument.data())
      .filter((user) => isApprovedUser(user))
      .map((user) => String(user.username ?? "")),
  );
}

export async function fetchLeaderboard(limitCount = 10) {
  const [leaderboardSnapshot, approvedUsernames] = await Promise.all([
    getDocs(query(collection(db, SUBMISSIONS_COLLECTION))),
    fetchApprovedUsernames(),
  ]);

  return buildLeaderboard(
    leaderboardSnapshot.docs.map((submissionDocument) =>
      submissionDocument.data(),
    ),
    limitCount,
    approvedUsernames,
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
        submission.username === username && isActiveValidatedSubmission(submission),
    );

  if (userSubmissions.length === 0) {
    return {
      averageScore: 0,
      submissionCount: 0,
    };
  }

  const totalScore = userSubmissions.reduce(
    (total, submission) => total + getEffectiveSubmissionScore(submission),
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
      fetchApprovedUsernames()
        .then((approvedUsernames) => {
          onUpdate(
            buildLeaderboard(
              snapshot.docs.map((submissionDocument) =>
                submissionDocument.data(),
              ),
              limitCount,
              approvedUsernames,
            ),
          );
        })
        .catch(onError);
    },
    onError,
  );
}
