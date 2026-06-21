"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryBarChart } from "@/components/analytics/CategoryBarChart";
import { useAuth } from "@/hooks/useAuth";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import {
  buildCategoryAverages,
  buildCategoryChartData,
  getActiveValidatedSubmissions,
} from "@/services/analyticsService";
import {
  getEffectiveSubmissionScore,
  getEffectiveUserStatus,
} from "@/services/moderationUtils";
import { ScoreMap } from "@/types/score";
import { Submission } from "@/types/submission";

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

function AnalyticsGraphCard({
  title,
  overallScore,
  date,
  scores,
  emptyMessage,
  children,
}: {
  title: string;
  overallScore?: number;
  date?: string;
  scores?: ScoreMap;
  emptyMessage: string;
  children?: ReactNode;
}) {
  const chartData = scores ? buildCategoryChartData(scores) : [];

  return (
    <article className="card overflow-hidden p-5">
      <div className="flex min-w-0 flex-col gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-white">
            {title}
          </h3>
          {date && <p className="mt-1 text-sm text-zinc-500">{date}</p>}
        </div>
        {overallScore !== undefined && (
          <div className="inline-flex shrink-0 items-baseline gap-0.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-semibold text-emerald-300">
            <span className="text-lg">{overallScore}</span>
            <span className="text-xs text-emerald-400/70">/100</span>
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <div className="mt-5 min-w-0">
          <CategoryBarChart data={chartData} />
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          {emptyMessage}
        </p>
      )}

      {children}
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

  const activeValidatedSubmissions = useMemo(
    () => getActiveValidatedSubmissions(submissions),
    [submissions],
  );
  const latestSubmission = activeValidatedSubmissions.at(-1);
  const highestSubmission = useMemo(
    () =>
      activeValidatedSubmissions.reduce<Submission | undefined>(
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
      ),
    [activeValidatedSubmissions],
  );
  const averageCategoryScores = useMemo(
    () => buildCategoryAverages(activeValidatedSubmissions),
    [activeValidatedSubmissions],
  );
  const averageScore = getAverageOverallScore(activeValidatedSubmissions);
  const submissionCount = activeValidatedSubmissions.length;

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

        <Link
          className="card card-hover group flex items-center justify-between gap-4 p-5"
          href="/prompts"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="eyebrow text-emerald-400">Daily Prompt</p>
              <p className="mt-1 text-base font-semibold text-white">
                Open current prompt
              </p>
            </div>
          </div>
          <span className="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-zinc-300">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M9 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>

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
              Performance Graphs
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
            <div className="mt-5 grid min-w-0 gap-5">
              <AnalyticsGraphCard
                date={`Submitted ${formatDate(latestSubmission?.submittedAt)}`}
                emptyMessage="Latest submission has no category data."
                overallScore={
                  latestSubmission
                    ? getEffectiveSubmissionScore(latestSubmission)
                    : undefined
                }
                scores={latestSubmission?.scores}
                title="Latest Submission Graph"
              />

              <AnalyticsGraphCard
                date={`Submitted ${formatDate(highestSubmission?.submittedAt)}`}
                emptyMessage="Highest score submission has no category data."
                overallScore={
                  highestSubmission
                    ? getEffectiveSubmissionScore(highestSubmission)
                    : undefined
                }
                scores={highestSubmission?.scores}
                title="Highest Score Graph"
              />

              {submissionCount >= 2 ? (
                <AnalyticsGraphCard
                  emptyMessage="Average category data is not available yet."
                  overallScore={averageScore}
                  scores={averageCategoryScores}
                  title="Average Performance Graph"
                />
              ) : (
                <article className="card p-5">
                  <h3 className="text-lg font-semibold text-white">
                    Average Performance Graph
                  </h3>
                  <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
                    Average graph requires multiple submissions.
                  </p>
                </article>
              )}
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
