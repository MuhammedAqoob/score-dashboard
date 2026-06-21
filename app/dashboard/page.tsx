"use client";

import { FormEvent, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { SCORE_CATEGORIES } from "@/services/analysisService";
import {
  buildCategoryAverages,
  getActiveValidatedSubmissions,
} from "@/services/analyticsService";
import {
  getEffectiveSubmissionScore,
  getEffectiveUserStatus,
} from "@/services/moderationUtils";
import { ScoreMap } from "@/types/score";
import { Submission } from "@/types/submission";

type AnalyticsSeries = {
  key: "latest" | "highest" | "average";
  label: string;
  score: number;
  date?: string;
  scores?: ScoreMap;
  color: string;
};

type AnalyticsTooltipPayload = {
  color?: string;
  name?: string;
  value?: number | string;
};

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) {
    return "-";
  }

  return timestamp.toDate().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAverageOverallScore(submissions: Submission[]) {
  if (submissions.length === 0) {
    return 0;
  }

  const total = submissions.reduce(
    (sum, submission) => sum + getEffectiveSubmissionScore(submission),
    0,
  );

  return Math.round(total / submissions.length);
}

function formatAxisLabel(label: string) {
  const labelMap: Record<string, string> = {
    "Problem-solving": "Problem",
    Brainstorming: "Ideas",
    "Research skill": "Research",
    "Learning speed": "Learning",
    "Analytical thinking": "Analytical",
    "Technical/logical thinking": "Tech/logical",
    "Communication clarity": "Comm.",
    "Decision making": "Decision",
    "Self-correction": "Self-correct",
    "Planning/execution": "Planning",
    "Curiosity/initiative": "Curiosity",
    "Persistence/consistency": "Persistence",
    "Prompt quality": "Prompt",
  };

  return labelMap[label] ?? label;
}

const analyticsTooltipStyle = {
  background: "rgba(9, 9, 11, 0.95)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 10,
  color: "#f4f4f5",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 20px 40px -20px rgba(0,0,0,0.8)",
} as const;

function AnalyticsTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: readonly AnalyticsTooltipPayload[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const items = payload.flatMap((item) => {
    const value =
      typeof item.value === "number" ? item.value : Number(item.value);

    if (!Number.isFinite(value)) {
      return [];
    }

    return [
      {
        color: item.color ?? "#d4d4d8",
        name: item.name ?? "Score",
        value,
      },
    ];
  });

  return (
    <div
      className="min-w-48 rounded-xl border border-white/10 bg-zinc-950/95 p-3 text-xs text-zinc-200 shadow-2xl shadow-black/50"
      style={analyticsTooltipStyle}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-zinc-500">
        Skill
      </p>
      <p className="mt-1 font-semibold text-white">{label}</p>
      <div className="mt-3 grid gap-1.5">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-3" key={item.name}>
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-zinc-300">{item.name}</span>
            </span>
            <span className="font-semibold text-zinc-100">{item.value}/100</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildUnifiedAnalyticsData(series: AnalyticsSeries[]) {
  return SCORE_CATEGORIES.flatMap((category) => {
    const row: Record<string, number | string> = {
      name: category.label,
    };

    series.forEach((item) => {
      const score = item.scores?.[category.key];

      if (score !== undefined) {
        row[item.key] = score;
      }
    });

    return Object.keys(row).length > 1 ? [row] : [];
  });
}

function UnifiedAnalyticsCard({ series }: { series: AnalyticsSeries[] }) {
  const chartData = useMemo(() => buildUnifiedAnalyticsData(series), [series]);
  const chartHeight = Math.max(430, chartData.length * 64 + 80);

  return (
    <article className="card min-w-0 overflow-hidden p-5 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 border-b border-white/[0.07] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Today&apos;s Analytics</p>
          <h3 className="mt-2 break-words text-xl font-semibold text-white">
            Score Profile
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Latest submission, best score, and average performance in one
            category view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {series.map((item) => (
            <div
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2"
              key={item.key}
            >
              <p className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </p>
              <p className="mt-1 font-semibold text-white">
                {item.score}
                <span className="text-xs text-zinc-500">/100</span>
              </p>
              {item.date && (
                <p className="mt-0.5 text-[0.68rem] text-zinc-500">
                  {item.date}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div
          className="mt-5 w-full max-w-full min-w-0 overflow-hidden"
          style={{ height: chartHeight }}
        >
          <ResponsiveContainer
            height="100%"
            minHeight={1}
            minWidth={1}
            width="100%"
          >
            <BarChart
              barCategoryGap={16}
              barGap={5}
              data={chartData}
              layout="vertical"
              margin={{ bottom: 8, left: 4, right: 10, top: 8 }}
            >
              <CartesianGrid
                horizontal={false}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <XAxis
                domain={[0, 100]}
                stroke="rgba(255,255,255,0.20)"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                type="number"
              />
              <YAxis
                dataKey="name"
                interval={0}
                stroke="rgba(255,255,255,0.20)"
                tick={{ fill: "#d4d4d8", fontSize: 11 }}
                tickFormatter={formatAxisLabel}
                type="category"
                width={96}
              />
              <Tooltip
                content={(props) => (
                  <AnalyticsTooltip
                    active={props.active}
                    label={String(props.label ?? "")}
                    payload={
                      props.payload as readonly AnalyticsTooltipPayload[]
                    }
                  />
                )}
                cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
              />
              <Legend wrapperStyle={{ color: "#d4d4d8", fontSize: 12 }} />
              {series.map((item) => (
                <Bar
                  animationDuration={700}
                  dataKey={item.key}
                  fill={item.color}
                  key={item.key}
                  name={item.label}
                  radius={[0, 8, 8, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          Category data is not available yet.
        </p>
      )}
    </article>
  );
}

function DashboardContent() {
  const { firebaseUser, profile, logout, updateProfile } = useAuth();
  const {
    submissions,
    loading: submissionsLoading,
    error: submissionsError,
  } = useUserSubmissions(profile?.username);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const userStatus = getEffectiveUserStatus(profile);

  const activeValidatedSubmissions = getActiveValidatedSubmissions(submissions);
  const latestSubmission = activeValidatedSubmissions.at(-1);
  const highestSubmission = activeValidatedSubmissions.reduce<
    Submission | undefined
  >(
    (currentHighest, submission) => {
      if (!currentHighest) {
        return submission;
      }

      return getEffectiveSubmissionScore(submission) >
        getEffectiveSubmissionScore(currentHighest)
        ? submission
        : currentHighest;
    },
    undefined,
  );
  const averageCategoryScores = buildCategoryAverages(
    activeValidatedSubmissions,
  );
  const averageScore = getAverageOverallScore(activeValidatedSubmissions);
  const submissionCount = activeValidatedSubmissions.length;
  const latestScore = latestSubmission
    ? getEffectiveSubmissionScore(latestSubmission)
    : 0;
  const highestScore = highestSubmission
    ? getEffectiveSubmissionScore(highestSubmission)
    : 0;
  const analyticsSeries: AnalyticsSeries[] = latestSubmission
    ? [
        {
          key: "latest",
          label: "Latest",
          score: latestScore,
          date: formatDate(latestSubmission.submittedAt),
          scores: latestSubmission.scores,
          color: "#34d399",
        },
        ...(submissionCount > 1 &&
        highestSubmission &&
        highestScore !== latestScore
          ? [
              {
                key: "highest" as const,
                label: "Best",
                score: highestScore,
                date: formatDate(highestSubmission.submittedAt),
                scores: highestSubmission.scores,
                color: "#38bdf8",
              },
            ]
          : []),
        ...(submissionCount > 1
          ? [
              {
                key: "average" as const,
                label: "Average",
                score: averageScore,
                scores: averageCategoryScores,
                color: "#a1a1aa",
              },
            ]
          : []),
      ]
    : [];

  const handleUsernameSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!firebaseUser) {
      setMessage("Anonymous session is not ready.");
      return;
    }

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setMessage("Username cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      await updateProfile({ username: cleanUsername });
      setMessage("Username saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save username.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-8 text-zinc-50 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome, {profile?.username}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Your validated scorecards, analytics, and account overview.
            </p>
          </div>

          <button
            className="btn btn-ghost w-full sm:w-auto"
            onClick={logout}
            type="button"
          >
            Logout
          </button>
        </header>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card card-hover p-5">
            <p className="text-xs font-medium text-zinc-400">Username</p>
            <p className="mt-3 break-words text-xl font-semibold tracking-tight">
              {profile?.username ?? "Unknown"}
            </p>
          </div>

          <div className="card card-hover p-5">
            <p className="text-xs font-medium text-zinc-400">Score</p>
            <p className="mt-3 text-xl font-semibold tracking-tight">
              {submissionsLoading ? (
                <span className="inline-block h-6 w-10 animate-pulse rounded bg-white/10 align-middle" />
              ) : (
                <span className="text-emerald-400">{averageScore}</span>
              )}
            </p>
            <p className="mt-1.5 text-xs text-zinc-500">
              {submissionCount} validated submission{submissionCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="card card-hover p-5">
            <p className="text-xs font-medium text-zinc-400">Status</p>
            <div className="mt-3">
              <StatusBadge status={userStatus} />
            </div>
            {userStatus === "banned" && (
              <p className="mt-2.5 text-xs leading-5 text-red-200">
                {profile?.banReason ? `${profile.banReason}. ` : ""}
                {profile?.bannedUntil
                  ? `Until ${profile.bannedUntil.toDate().toLocaleString()}`
                  : "No end date set"}
              </p>
            )}
          </div>

          <div className="card card-hover p-5">
            <p className="text-xs font-medium text-zinc-400">Created</p>
            <p className="mt-3 text-xl font-semibold tracking-tight">
              {formatDate(profile?.createdAt)}
            </p>
          </div>
        </div>

        <section className="card min-w-0 p-5 sm:p-6">
          <div>
            <p className="eyebrow">Analytics</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Today&apos;s Analytics
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              These charts are rebuilt from your stored validated submissions,
              so they persist after refresh and login changes.
            </p>
          </div>

          {submissionsError && (
            <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submissionsError}
            </p>
          )}

          {!submissionsLoading && !submissionsError && submissionCount === 0 && (
            <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-400">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 17v-6m3 6V8m3 9v-4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-200">
                  No validated submissions yet
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Submit a scorecard from the home page to start tracking.
                </p>
              </div>
            </div>
          )}

          {submissionCount > 0 && (
            <div className="mt-5 min-w-0">
              <UnifiedAnalyticsCard series={analyticsSeries} />
            </div>
          )}
        </section>

        <div className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Profile Settings</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Update your display username.
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={handleUsernameSave}
          >
            <input
              className="input sm:flex-1"
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
            <button
              className="btn btn-primary sm:w-auto"
              disabled={saving}
              type="submit"
            >
              {saving && <span className="spinner !h-4 !w-4 !border-emerald-950/40 !border-t-emerald-950" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </form>

          {message && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                message === "Username saved."
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-white/[0.04] text-zinc-300"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
