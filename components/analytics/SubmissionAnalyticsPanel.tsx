"use client";

import { CategoryBarChart } from "@/components/analytics/CategoryBarChart";
import { CategoryComparisonChart } from "@/components/analytics/CategoryComparisonChart";
import { CategoryScoreCards } from "@/components/analytics/CategoryScoreCards";
import { ChartPanel } from "@/components/analytics/ChartPanel";
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

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${
          accent ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
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
    <section className="card min-w-0 overflow-hidden p-5 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Submission analytics</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            {result.validated ? "Validated result" : "Validation mismatch"}
          </h2>
          <p className="mt-2 break-words text-sm text-zinc-400">{result.message}</p>
        </div>
        <div
          className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold ${
            result.validated
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {result.validated ? "Validation passed" : "Validation failed"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatTile
          label="AI-reported score"
          value={`${result.aiReportedScore ?? "-"}/100`}
        />
        <StatTile
          accent
          label="Site-calculated score"
          value={`${result.calculatedScore}/100`}
        />
        <StatTile
          label="Detected categories"
          value={`${categoryData.length}`}
        />
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
        <p className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Analytics charts were skipped because this response did not pass score
          validation. Check the final overall score and category values, then
          submit a corrected response.
        </p>
      )}

      {result.validated && (
        <div className="mt-6 grid min-w-0 gap-4">
          <ChartPanel title="Category score chart">
            <CategoryBarChart data={categoryData} />
          </ChartPanel>

          <ChartPanel title="Today vs average">
            {showAverageAnalytics && comparisonData.length > 0 ? (
              <CategoryComparisonChart data={comparisonData} />
            ) : (
              <p className="text-sm text-zinc-400">
                Average analytics will appear after more submissions.
              </p>
            )}
          </ChartPanel>

          <ChartPanel title="Score trend history">
            <ScoreTrendChart data={trendData} />
          </ChartPanel>
        </div>
      )}
    </section>
  );
}
