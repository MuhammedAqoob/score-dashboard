import { SCORE_CATEGORIES, getScoreLabel } from "@/services/analysisService";
import {
  getEffectiveSubmissionScore,
  isActiveValidatedSubmission,
} from "@/services/moderationUtils";
import { ScoreKey, ScoreMap } from "@/types/score";
import { Submission } from "@/types/submission";

export type CategoryChartItem = {
  key: ScoreKey;
  name: string;
  score: number;
  color: string;
  label: string;
};

export type CategoryComparisonItem = {
  key: ScoreKey;
  name: string;
  today: number;
  average: number;
};

export type PeerComparisonItem = {
  key: ScoreKey;
  name: string;
  currentUser: number;
  selectedUser: number;
};

export type TrendPoint = {
  date: string;
  score: number;
};

export type PlatformAnalytics = {
  strongestCategory: CategoryChartItem | null;
  weakestCategory: CategoryChartItem | null;
  dailySubmissionCounts: Array<{ date: string; count: number }>;
  validationRatio: Array<{ name: string; value: number }>;
  averageScoreTrend: Array<{ date: string; averageScore: number }>;
};

function getSubmissionMillis(submission: Submission) {
  return submission.submittedAt?.toMillis() ?? 0;
}

function formatTrendDate(submission: Submission) {
  if (submission.submittedAt) {
    return submission.submittedAt.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return submission.dayKey;
}

export function getScoreColor(score: number) {
  if (score >= 90) {
    return "#22c55e";
  }

  if (score >= 70) {
    return "#84cc16";
  }

  if (score >= 50) {
    return "#eab308";
  }

  return "#ef4444";
}

export function getScoreQualityLabel(score: number) {
  if (score >= 90) {
    return "Strong";
  }

  if (score >= 70) {
    return "Healthy";
  }

  if (score >= 50) {
    return "Average";
  }

  return "Needs focus";
}

export function buildCategoryChartData(scores: ScoreMap): CategoryChartItem[] {
  return SCORE_CATEGORIES.flatMap((category) => {
    const score = scores[category.key];

    if (score === undefined) {
      return [];
    }

    return [
      {
        key: category.key,
        name: category.label,
        score,
        color: getScoreColor(score),
        label: getScoreQualityLabel(score),
      },
    ];
  });
}

export function getActiveValidatedSubmissions(submissions: Submission[]) {
  return submissions
    .filter(isActiveValidatedSubmission)
    .sort((first, second) => getSubmissionMillis(first) - getSubmissionMillis(second));
}

export function buildCategoryAverages(submissions: Submission[]) {
  const totals = new Map<ScoreKey, { total: number; count: number }>();

  getActiveValidatedSubmissions(submissions).forEach((submission) => {
    SCORE_CATEGORIES.forEach((category) => {
      const score = submission.scores?.[category.key];

      if (score === undefined) {
        return;
      }

      const current = totals.get(category.key) ?? { total: 0, count: 0 };
      totals.set(category.key, {
        total: current.total + score,
        count: current.count + 1,
      });
    });
  });

  return Object.fromEntries(
    Array.from(totals.entries()).map(([key, value]) => [
      key,
      Math.round(value.total / value.count),
    ]),
  ) as Partial<Record<ScoreKey, number>>;
}

export function buildCategoryMaxScores(submissions: Submission[]) {
  const maxScores = new Map<ScoreKey, number>();

  getActiveValidatedSubmissions(submissions).forEach((submission) => {
    SCORE_CATEGORIES.forEach((category) => {
      const score = submission.scores?.[category.key];

      if (score === undefined) {
        return;
      }

      maxScores.set(
        category.key,
        Math.max(maxScores.get(category.key) ?? 0, score),
      );
    });
  });

  return Object.fromEntries(maxScores.entries()) as Partial<
    Record<ScoreKey, number>
  >;
}

export function buildPeerComparisonData(
  currentScores: Partial<Record<ScoreKey, number>>,
  selectedScores: Partial<Record<ScoreKey, number>>,
) {
  return SCORE_CATEGORIES.flatMap<PeerComparisonItem>((category) => {
    const currentUser = currentScores[category.key];
    const selectedUser = selectedScores[category.key];

    if (currentUser === undefined && selectedUser === undefined) {
      return [];
    }

    return [
      {
        key: category.key,
        name: category.label,
        currentUser: currentUser ?? 0,
        selectedUser: selectedUser ?? 0,
      },
    ];
  });
}

export function buildCategoryComparisonData(
  todayScores: ScoreMap,
  historicalSubmissions: Submission[],
) {
  const averages = buildCategoryAverages(historicalSubmissions);

  return SCORE_CATEGORIES.flatMap<CategoryComparisonItem>((category) => {
    const today = todayScores[category.key];
    const average = averages[category.key];

    if (today === undefined || average === undefined) {
      return [];
    }

    return [
      {
        key: category.key,
        name: category.label,
        today,
        average,
      },
    ];
  });
}

export function buildScoreTrendData(submissions: Submission[]): TrendPoint[] {
  return getActiveValidatedSubmissions(submissions).map((submission) => ({
    date: formatTrendDate(submission),
    score: getEffectiveSubmissionScore(submission),
  }));
}

export function buildPlatformAnalytics(
  submissions: Submission[],
): PlatformAnalytics {
  const activeSubmissions = submissions.filter(
    (submission) => (submission.status ?? "active") === "active",
  );
  const activeValidated = getActiveValidatedSubmissions(submissions);
  const categoryAverages = buildCategoryAverages(activeValidated);
  const categoryItems = Object.entries(categoryAverages).map(([key, score]) => ({
    key: key as ScoreKey,
    name: getScoreLabel(key as ScoreKey),
    score,
    color: getScoreColor(score),
    label: getScoreQualityLabel(score),
  }));
  const sortedCategoryItems = [...categoryItems].sort(
    (first, second) => second.score - first.score,
  );
  const dailyCounts = new Map<string, number>();
  const dailyScoreTotals = new Map<string, { total: number; count: number }>();

  activeValidated.forEach((submission) => {
    const dayKey = submission.dayKey;
    dailyCounts.set(dayKey, (dailyCounts.get(dayKey) ?? 0) + 1);
    const current = dailyScoreTotals.get(dayKey) ?? { total: 0, count: 0 };
    dailyScoreTotals.set(dayKey, {
      total: current.total + getEffectiveSubmissionScore(submission),
      count: current.count + 1,
    });
  });

  const validatedCount = activeSubmissions.filter((submission) =>
    Boolean(submission.validated),
  ).length;
  const failedCount = Math.max(activeSubmissions.length - validatedCount, 0);

  return {
    strongestCategory: sortedCategoryItems[0] ?? null,
    weakestCategory: sortedCategoryItems.at(-1) ?? null,
    dailySubmissionCounts: Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((first, second) => first.date.localeCompare(second.date)),
    validationRatio: [
      { name: "Validated", value: validatedCount },
      { name: "Failed", value: failedCount },
    ],
    averageScoreTrend: Array.from(dailyScoreTotals.entries())
      .map(([date, value]) => ({
        date,
        averageScore: Math.round(value.total / value.count),
      }))
      .sort((first, second) => first.date.localeCompare(second.date)),
  };
}
