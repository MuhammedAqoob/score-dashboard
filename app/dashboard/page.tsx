"use client";

import { FormEvent, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AnalyticsSeries,
  DashboardAnalyticsCard,
} from "@/components/dashboard/DashboardAnalyticsCard";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { useAuth } from "@/hooks/useAuth";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import {
  buildCategoryAverages,
  getActiveValidatedSubmissions,
} from "@/services/analyticsService";
import {
  getEffectiveSubmissionScore,
  getEffectiveUserStatus,
} from "@/services/moderationUtils";
import { Submission } from "@/types/submission";
import { formatDate } from "@/utils/formatDate";

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
              <DashboardAnalyticsCard series={analyticsSeries} />
            </div>
          )}
        </section>

        <ProfileSettings
          message={message}
          onSave={handleUsernameSave}
          saving={saving}
          setUsername={setUsername}
          username={username}
        />
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
