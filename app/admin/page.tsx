"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AppToast } from "@/components/AppToast";
import { MetricCard } from "@/components/MetricCard";
import { AdminActivityLogs } from "@/components/admin/AdminActivityLogs";
import { AdminModerationQueue } from "@/components/admin/AdminModerationQueue";
import { AdminPromptManager } from "@/components/admin/AdminPromptManager";
import { AdminSubmissionReview } from "@/components/admin/AdminSubmissionReview";
import { AdminAnalyticsOverview } from "@/components/analytics/AdminAnalyticsOverview";
import { useActivePrompt } from "@/hooks/useActivePrompt";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { useAdminScores } from "@/hooks/useAdminScores";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminSubmissions } from "@/hooks/useAdminSubmissions";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useValidationEvents } from "@/hooks/useValidationEvents";
import {
  editSubmissionOverallScore,
  setSubmissionDeleted,
} from "@/services/adminSubmissionService";
import {
  banUser,
  setUserApproval,
  setUserStatus,
  unbanUser,
} from "@/services/adminUserService";
import { Submission } from "@/types/submission";
import { UserProfileWithId, UserStatus } from "@/types/user";

const ADMIN_PREVIEW_LIMIT = 10;

function AdminDashboardContent() {
  const { logout } = useAdminAuth();
  const router = useRouter();
  const { prompt, loading: promptLoading, reload } = useActivePrompt();
  const { stats, loading: statsLoading, error: statsError } = useAdminStats();
  const { users, loading: usersLoading, error: usersError } = useAdminUsers();
  const { scores, loading: scoresLoading, error: scoresError } =
    useAdminScores();
  const {
    submissions,
    loading: submissionsLoading,
    error: submissionsError,
  } = useAdminSubmissions();
  const { logs, loading: logsLoading, error: logsError } = useAdminLogs();
  const {
    events: validationEvents,
    error: validationEventsError,
  } = useValidationEvents();
  // Current prototype opens several live Firestore listeners here for admin
  // users, submissions, scores, stats, logs, validation events, and prompt data.
  // TODO: consolidate admin page subscriptions when the client-heavy prototype
  // architecture is ready for a larger data-layer pass.
  const [message, setMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [banDrafts, setBanDrafts] = useState<
    Record<string, { until: string; reason: string }>
  >({});
  const [editingSubmissionId, setEditingSubmissionId] = useState("");
  const [scoreDraft, setScoreDraft] = useState("");

  const filteredUsers = useMemo(() => {
    const searchValue = userSearch.trim().toLowerCase();
    return searchValue
      ? users.filter((user) => user.username.includes(searchValue))
      : users;
  }, [users, userSearch]);

  const filteredSubmissions = useMemo(() => {
    const searchValue = submissionSearch.trim().toLowerCase();
    return searchValue
      ? submissions.filter(
          (submission) =>
            submission.username.toLowerCase().includes(searchValue) ||
            submission.dayKey.includes(searchValue),
        )
      : submissions;
  }, [submissions, submissionSearch]);

  const visibleUsers = showAllUsers
    ? filteredUsers
    : filteredUsers.slice(0, ADMIN_PREVIEW_LIMIT);
  const visibleSubmissions = showAllSubmissions
    ? filteredSubmissions
    : filteredSubmissions.slice(0, ADMIN_PREVIEW_LIMIT);

  const showToast = (nextMessage: string) => {
    setToastMessage(nextMessage);
    window.setTimeout(() => setToastMessage(""), 1800);
  };

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  const handleUserStatus = async (
    user: UserProfileWithId,
    status: UserStatus,
  ) => {
    if (
      status === "revoked" &&
      !window.confirm(`Revoke access for ${user.username}?`)
    ) {
      return;
    }

    setMessage("");

    try {
      if (status === "approved" || status === "revoked") {
        await setUserApproval(user.username, status === "approved");
      } else {
        await setUserStatus(user.username, status);
      }

      setMessage(`${user.username} set to ${status}.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update user.",
      );
    }
  };

  const handleBanUser = async (user: UserProfileWithId) => {
    const draft = banDrafts[user.username] ?? { until: "", reason: "" };

    if (!window.confirm(`Ban ${user.username} from submitting responses?`)) {
      return;
    }

    setMessage("");

    try {
      await banUser(
        user.username,
        draft.until ? new Date(draft.until) : null,
        draft.reason,
      );
      setMessage(`${user.username} banned.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not ban user.");
    }
  };

  const handleUnbanUser = async (user: UserProfileWithId) => {
    setMessage("");

    try {
      await unbanUser(user.username);
      setMessage(`${user.username} unbanned.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not unban user.",
      );
    }
  };

  const handleEditScore = async (submission: Submission) => {
    setMessage("");

    try {
      await editSubmissionOverallScore(submission, Number(scoreDraft));
      setEditingSubmissionId("");
      setScoreDraft("");
      setMessage("Score updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update score.",
      );
    }
  };

  const handleDeleteRestore = async (
    submission: Submission,
    deleted: boolean,
  ) => {
    if (
      deleted &&
      !window.confirm("Soft delete this submission from leaderboard totals?")
    ) {
      return;
    }

    setMessage("");

    try {
      await setSubmissionDeleted(submission, deleted);
      setMessage(deleted ? "Submission deleted." : "Submission restored.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update submission.",
      );
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-8 text-zinc-50 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Admin</p>
            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
              Admin Control Center
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Manage users, prompts, moderation, and analytics.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              className="btn btn-logout w-full sm:w-auto"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        {message && (
          <p className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-zinc-200 animate-fade-in">
            {message}
          </p>
        )}
        {statsError && (
          <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {statsError}
          </p>
        )}

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Users" value={statsLoading ? "..." : stats?.totalUsers ?? 0} />
          <MetricCard label="Approved Users" value={statsLoading ? "..." : stats?.approvedUsers ?? 0} positive />
          <MetricCard label="Banned Users" value={statsLoading ? "..." : stats?.bannedUsers ?? 0} />
          <MetricCard label="Pending Users" value={statsLoading ? "..." : stats?.pendingUsers ?? 0} />
          <MetricCard label="Active Submissions" value={statsLoading ? "..." : stats?.activeSubmissions ?? 0} />
          <MetricCard label="Deleted Submissions" value={statsLoading ? "..." : stats?.deletedSubmissions ?? 0} />
          <MetricCard label="Average Platform Score" value={statsLoading ? "..." : `${stats?.averagePlatformScore ?? 0}/100`} />
          <MetricCard label="Today's Average Score" value={statsLoading ? "..." : `${stats?.todaysAverageScore ?? 0}/100`} positive />
        </div>

        {validationEventsError && (
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Validation event analytics unavailable: {validationEventsError}
          </p>
        )}

        <AdminAnalyticsOverview
          submissions={submissions}
          validationEvents={validationEvents}
        />

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-5 py-4 text-sm text-emerald-100 shadow-[0_18px_46px_-34px_rgba(52,211,153,0.7)]">
          <p className="font-semibold">Admins manage submissions here.</p>
          <p className="mt-1 text-emerald-100/75">
            Submission entry is for users; this control center is for review,
            moderation, and platform oversight.
          </p>
        </div>

        <AdminModerationQueue
          banDrafts={banDrafts}
          filteredUsers={filteredUsers}
          onBanUser={handleBanUser}
          onUnbanUser={handleUnbanUser}
          onUserStatus={handleUserStatus}
          previewLimit={ADMIN_PREVIEW_LIMIT}
          scores={scores}
          scoresError={scoresError}
          scoresLoading={scoresLoading}
          setBanDrafts={setBanDrafts}
          setShowAllUsers={setShowAllUsers}
          setUserSearch={setUserSearch}
          showAllUsers={showAllUsers}
          userSearch={userSearch}
          usersError={usersError}
          usersLoading={usersLoading}
          visibleUsers={visibleUsers}
        />

        <AdminSubmissionReview
          editingSubmissionId={editingSubmissionId}
          filteredSubmissions={filteredSubmissions}
          onDeleteRestore={handleDeleteRestore}
          onEditScore={handleEditScore}
          previewLimit={ADMIN_PREVIEW_LIMIT}
          scoreDraft={scoreDraft}
          setEditingSubmissionId={setEditingSubmissionId}
          setScoreDraft={setScoreDraft}
          setShowAllSubmissions={setShowAllSubmissions}
          setSubmissionSearch={setSubmissionSearch}
          showAllSubmissions={showAllSubmissions}
          submissionSearch={submissionSearch}
          submissionsError={submissionsError}
          submissionsLoading={submissionsLoading}
          visibleSubmissions={visibleSubmissions}
        />

        <AdminActivityLogs
          logs={logs}
          logsError={logsError}
          logsLoading={logsLoading}
        />

        <AdminPromptManager
          prompt={prompt}
          promptLoading={promptLoading}
          reloadPrompt={reload}
          setMessage={setMessage}
          showToast={showToast}
        />
      </section>
      <AppToast message={toastMessage} />
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardContent />
    </AdminProtectedRoute>
  );
}
