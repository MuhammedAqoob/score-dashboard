import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentDayKey } from "@/services/dayKey";

export type AdminUserScore = {
  averageScore: number;
  todayScore: number | null;
  submissionCount: number;
  latestScore: number | null;
  latestResponseText: string;
};

export type AdminScoreMap = Record<string, AdminUserScore>;

export function subscribeToAdminScores(
  onUpdate: (scores: AdminScoreMap) => void,
  onError: (error: Error) => void,
) {
  const todayKey = getCurrentDayKey();

  return onSnapshot(
    query(collection(db, "submissions")),
    (snapshot) => {
      const totals = new Map<
        string,
        {
          total: number;
          count: number;
          todayScore: number | null;
          latestScore: number | null;
          latestResponseText: string;
          latestSubmittedAt: number;
        }
      >();

      snapshot.docs.forEach((submissionDocument) => {
        const submission = submissionDocument.data();
        const username = String(submission.username ?? "");
        const validated = Boolean(submission.validated);
        const calculatedScore = Number(submission.calculatedScore ?? 0);
        const dayKey = String(submission.dayKey ?? "");
        const responseText = String(submission.responseText ?? "");
        const submittedAt = submission.submittedAt?.toMillis?.() ?? 0;

        if (!username || !validated) {
          return;
        }

        const current = totals.get(username) ?? {
          total: 0,
          count: 0,
          todayScore: null,
          latestScore: null,
          latestResponseText: "",
          latestSubmittedAt: 0,
        };
        const isLatest = submittedAt >= current.latestSubmittedAt;

        totals.set(username, {
          total: current.total + calculatedScore,
          count: current.count + 1,
          todayScore: dayKey === todayKey ? calculatedScore : current.todayScore,
          latestScore: isLatest ? calculatedScore : current.latestScore,
          latestResponseText: isLatest ? responseText : current.latestResponseText,
          latestSubmittedAt: isLatest ? submittedAt : current.latestSubmittedAt,
        });
      });

      const scores = Object.fromEntries(
        Array.from(totals.entries()).map(([username, scoreData]) => [
          username,
          {
            averageScore: Math.round(scoreData.total / scoreData.count),
            todayScore: scoreData.todayScore,
            submissionCount: scoreData.count,
            latestScore: scoreData.latestScore,
            latestResponseText: scoreData.latestResponseText,
          },
        ]),
      );

      onUpdate(scores);
    },
    onError,
  );
}
