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
    <article className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-3 border-b border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-white">
            {title}
          </h3>
          {date && <p className="mt-1 text-sm text-zinc-500">{date}</p>}
        </div>
        {overallScore !== undefined && (
          <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 px-3 py-2 text-sm font-semibold text-emerald-200">
            {overallScore}/100
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <div className="mt-4 min-w-0">
          <CategoryBarChart data={chartData} />
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
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
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 px-4 py-6 text-zinc-50 sm:px-6 sm:py-8">
      <section className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-400">Dashboard</p>
            <h1 className="mt-1 break-words text-3xl font-semibold">
              Welcome, {profile?.username}
            </h1>
          </div>

          <button
            className="w-full cursor-pointer rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-300 active:bg-zinc-400 sm:w-auto"
            onClick={logout}
            type="button"
          >
            Logout
          </button>
        </header>

        <Link
          className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-5 transition-colors hover:border-emerald-500 hover:bg-emerald-950/50"
          href="/prompts"
        >
          <p className="text-sm font-medium text-emerald-400">Daily Prompt</p>
          <p className="mt-2 text-lg font-semibold">Open current prompt</p>
        </Link>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Username</p>
            <p className="mt-2 break-words text-xl font-semibold">
              {profile?.username ?? "Unknown"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Score</p>
            <p className="mt-2 text-xl font-semibold">
              {submissionsLoading ? "..." : averageScore}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {submissionCount} validated submissions
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Status</p>
            <div className="mt-2">
              <StatusBadge status={userStatus} />
            </div>
            {userStatus === "banned" && (
              <p className="mt-2 text-xs text-red-200">
                {profile?.banReason ? `${profile.banReason}. ` : ""}
                {profile?.bannedUntil
                  ? `Until ${profile.bannedUntil.toDate().toLocaleString()}`
                  : "No end date set"}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Created</p>
            <p className="mt-2 text-xl font-semibold">
              {formatDate(profile?.createdAt)}
            </p>
          </div>
        </div>

        <section className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
          <div>
            <p className="text-sm font-medium text-emerald-400">Analytics</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Performance Graphs
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              These charts are rebuilt from your stored validated submissions,
              so they persist after refresh and login changes.
            </p>
          </div>

          {submissionsError && (
            <p className="mt-4 rounded-md border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm text-red-100">
              {submissionsError}
            </p>
          )}

          {!submissionsLoading && !submissionsError && submissionCount === 0 && (
            <p className="mt-4 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
              No validated submissions yet.
            </p>
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
                <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
                  <h3 className="text-lg font-semibold text-white">
                    Average Performance Graph
                  </h3>
                  <p className="mt-4 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                    Average graph requires multiple submissions.
                  </p>
                </article>
              )}
            </div>
          )}
        </section>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="font-semibold">Profile Settings</h2>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={handleUsernameSave}
          >
            <input
              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
            <button
              className="cursor-pointer rounded-md bg-emerald-500 px-4 py-2 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 active:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>

          {message && <p className="mt-3 text-sm text-zinc-300">{message}</p>}
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
