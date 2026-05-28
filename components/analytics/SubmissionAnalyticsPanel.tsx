"use client";

import { CategoryBarChart } from "@/components/analytics/CategoryBarChart";
import { CategoryComparisonChart } from "@/components/analytics/CategoryComparisonChart";
import { CategoryScoreCards } from "@/components/analytics/CategoryScoreCards";
import { ScoreTrendChart } from "@/components/analytics/ScoreTrendChart";
import {
  buildCategoryChartData,
  buildCategoryComparisonData,
  buildScoreTrendData,
  getActiveValidatedSubmissions,
} from "@/services/analyticsService";
import { ScoreMap } from "@/types/score";
import { Submission } from "@/types/submission";

export type SubmissionAnalyticsResult = {
  id?: string;
  username?: string;
  dayKey?: string;
  scores: ScoreMap;
  aiReportedScore: number | null;
  calculatedScore: number;
  validated: boolean;
  message: string;
};

type SubmissionAnalyticsPanelProps = {
  result: SubmissionAnalyticsResult;
  historicalSubmissions: Submission[];
};

function buildLatestSubmission(result: SubmissionAnalyticsResult): Submission | null {
  if (!result.username || !result.dayKey || !result.validated) {
    return null;
  }

  return {
    id: result.id,
    username: result.username,
    promptId: "current",
    promptVersion: 0,
    dayKey: result.dayKey,
    responseText: "",
    scores: result.scores,
    aiReportedScore: result.aiReportedScore ?? 0,
    calculatedScore: result.calculatedScore,
    validated: result.validated,
    status: "active",
  };
}

export function SubmissionAnalyticsPanel({
  result,
  historicalSubmissions,
}: SubmissionAnalyticsPanelProps) {
  const categoryData = buildCategoryChartData(result.scores);
  const latestSubmission = buildLatestSubmission(result);
  const hasLatestInHistory = Boolean(
    result.id &&
      historicalSubmissions.some((submission) => submission.id === result.id),
  );
  const analyticsSubmissions =
    latestSubmission && !hasLatestInHistory
      ? [...historicalSubmissions, latestSubmission]
      : historicalSubmissions;
  const activeValidatedSubmissions =
    getActiveValidatedSubmissions(analyticsSubmissions);
  const historicalForComparison = latestSubmission
    ? activeValidatedSubmissions.filter(
        (submission) =>
          submission.id !== latestSubmission.id ||
          !latestSubmission.id,
      )
    : activeValidatedSubmissions;
  const comparisonData = buildCategoryComparisonData(
    result.scores,
    historicalForComparison,
  );
  const trendData = buildScoreTrendData(analyticsSubmissions);
  const showAverageAnalytics =
    result.validated && activeValidatedSubmissions.length >= 2;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Submission analytics
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            {result.validated ? "Validated result" : "Validation mismatch"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">{result.message}</p>
        </div>
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            result.validated
              ? "border-emerald-900/70 bg-emerald-950/30 text-emerald-100"
              : "border-red-900/70 bg-red-950/30 text-red-100"
          }`}
        >
          {result.validated ? "Validation passed" : "Validation failed"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">AI-reported score</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {result.aiReportedScore ?? "-"}/100
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Site-calculated score</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {result.calculatedScore}/100
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Detected categories</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {categoryData.length}
          </p>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white">Parsed categories</h3>
          <div className="mt-3">
            <CategoryScoreCards items={categoryData} />
          </div>
        </div>
      )}

      {!result.validated && (
        <p className="mt-6 rounded-md border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm text-red-100">
          Analytics charts were skipped because this response did not pass score
          validation. Check the final overall score and category values, then
          submit a corrected response.
        </p>
      )}

      {result.validated && (
        <div className="mt-6 grid gap-5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="text-lg font-semibold text-white">
              Category score chart
            </h3>
            <CategoryBarChart data={categoryData} />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="text-lg font-semibold text-white">
              Today vs average
            </h3>
            {showAverageAnalytics && comparisonData.length > 0 ? (
              <CategoryComparisonChart data={comparisonData} />
            ) : (
              <p className="mt-3 text-sm text-zinc-400">
                Average analytics will appear after more submissions.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="text-lg font-semibold text-white">
              Score trend history
            </h3>
            <ScoreTrendChart data={trendData} />
          </div>
        </div>
      )}
    </section>
  );
}
