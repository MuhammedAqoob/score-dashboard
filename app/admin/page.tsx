"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AppToast } from "@/components/AppToast";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
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
import {
  getEffectiveUserStatus,
  getSubmissionStatus,
} from "@/services/moderationUtils";
import {
  DEFAULT_ACTIVE_PROMPT_CONTENT,
  DEFAULT_ACTIVE_PROMPT_TITLE,
  EXPECTED_SCORECARD_FORMAT,
  saveActivePrompt,
} from "@/services/promptService";
import { Submission } from "@/types/submission";
import { UserProfileWithId, UserStatus } from "@/types/user";

const ADMIN_PREVIEW_LIMIT = 15;

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) {
    return "-";
  }

  return timestamp.toDate().toLocaleString();
}

function toLocalInputValue(timestamp?: Timestamp | null) {
  if (!timestamp) {
    return "";
  }

  const date = timestamp.toDate();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function SectionShell({
  title,
  description,
  eyebrow,
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="card admin-section min-w-0 overflow-hidden p-5 sm:p-6">
      <div className="border-b border-white/[0.07] pb-5">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-sm text-zinc-400">{description}</p>
        )}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const actionBtnBase =
  "rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

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
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
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

  const titleValue = title ?? prompt?.title ?? "";
  const contentValue = content ?? prompt?.content ?? "";
  const versionValue = version ?? prompt?.version ?? 1;

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

  const handleSavePrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    try {
      setSaving(true);
      await saveActivePrompt({
        title: titleValue,
        content: contentValue,
        version: versionValue,
      });
      await reload();
      showToast("Prompt saved");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save prompt.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  const handleUseStructuredDefault = () => {
    setTitle(DEFAULT_ACTIVE_PROMPT_TITLE);
    setContent(DEFAULT_ACTIVE_PROMPT_CONTENT);
    setVersion(versionValue + 1);
    setMessage("Structured default prompt loaded. Save to publish it.");
  };

  const handleUserStatus = async (user: UserProfileWithId, status: UserStatus) => {
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

  const handleDeleteRestore = async (submission: Submission, deleted: boolean) => {
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

        <SectionShell
          description="Review access status, bans, and user-level score summaries."
          eyebrow="Moderation"
          title="Moderation Queue"
        >
          <label className="block max-w-sm text-sm text-zinc-300">
            <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Search users
            </span>
            <input
              className="input mt-2 !min-h-11 !rounded-xl !bg-white/[0.045]"
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="username"
              value={userSearch}
            />
          </label>

          {usersLoading && (
            <div className="mt-4 flex items-center gap-3 text-sm text-zinc-400">
              <span className="spinner" />
              Loading users...
            </div>
          )}
          {(usersError || scoresError) && (
            <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {usersError || scoresError}
            </p>
          )}
          {!usersLoading && !usersError && filteredUsers.length === 0 && (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-12 text-center">
              <p className="text-sm text-zinc-400">No users found.</p>
            </div>
          )}
          {!usersLoading && !usersError && filteredUsers.length > 0 && (
            <>
              <div className="mt-4 grid gap-3 md:hidden">
                {visibleUsers.map((user) => {
                  const userScore = scores[user.username];
                  const status = getEffectiveUserStatus(user);
                  const draft = banDrafts[user.username] ?? {
                    until: toLocalInputValue(user.bannedUntil),
                    reason: user.banReason ?? "",
                  };

                  return (
                    <article
                      className="queue-card min-w-0 rounded-2xl p-4"
                      key={user.id}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="break-words font-semibold text-white">
                            {user.username}
                          </h4>
                          <p className="mt-1 text-xs text-zinc-500">
                            Average:{" "}
                            {scoresLoading
                              ? "..."
                              : `${userScore?.averageScore ?? 0}/100 (${userScore?.submissionCount ?? 0})`}
                          </p>
                        </div>
                        <StatusBadge status={status} />
                      </div>

                      <div className="mt-4 grid gap-3">
                        <label className="text-xs font-medium text-zinc-400">
                          Ban until
                          <input
                            className="input mt-1"
                            onChange={(event) =>
                              setBanDrafts({
                                ...banDrafts,
                                [user.username]: {
                                  ...draft,
                                  until: event.target.value,
                                },
                              })
                            }
                            type="datetime-local"
                            value={draft.until}
                          />
                        </label>
                        <label className="text-xs font-medium text-zinc-400">
                          Ban reason
                          <input
                            className="input mt-1"
                            onChange={(event) =>
                              setBanDrafts({
                                ...banDrafts,
                                [user.username]: {
                                  ...draft,
                                  reason: event.target.value,
                                },
                              })
                            }
                            placeholder="Optional reason"
                            value={draft.reason}
                          />
                        </label>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button className={`${actionBtnBase} bg-emerald-500 text-emerald-950 hover:bg-emerald-400`} onClick={() => handleUserStatus(user, "approved")} type="button">
                          Approve
                        </button>
                        <button className={`${actionBtnBase} border border-amber-500/30 text-amber-200 hover:bg-amber-500/10`} onClick={() => handleUserStatus(user, "revoked")} type="button">
                          Revoke
                        </button>
                        <button className={`${actionBtnBase} bg-red-500 text-white hover:bg-red-400`} onClick={() => handleBanUser(user)} type="button">
                          Ban
                        </button>
                        <button className={`${actionBtnBase} border border-white/10 text-zinc-200 hover:bg-white/[0.06]`} onClick={() => handleUnbanUser(user)} type="button">
                          Unban
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="queue-table-wrap mt-5 hidden max-w-full overflow-x-auto rounded-2xl md:block">
                <table className="pro-table admin-queue-table min-w-[980px]">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Status</th>
                      <th>Average</th>
                      <th>Ban Until</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUsers.map((user) => {
                      const userScore = scores[user.username];
                      const status = getEffectiveUserStatus(user);
                      const draft = banDrafts[user.username] ?? {
                        until: toLocalInputValue(user.bannedUntil),
                        reason: user.banReason ?? "",
                      };

                      return (
                        <tr key={user.id}>
                          <td className="font-medium text-white">
                            {user.username}
                          </td>
                          <td>
                            <StatusBadge status={status} />
                          </td>
                          <td>
                            {scoresLoading
                              ? "..."
                              : `${userScore?.averageScore ?? 0}/100 (${userScore?.submissionCount ?? 0})`}
                          </td>
                          <td>
                            <input
                              className="input !w-48 !py-1.5"
                              onChange={(event) =>
                                setBanDrafts({
                                  ...banDrafts,
                                  [user.username]: {
                                    ...draft,
                                    until: event.target.value,
                                  },
                                })
                              }
                              type="datetime-local"
                              value={draft.until}
                            />
                          </td>
                          <td>
                            <input
                              className="input !w-56 !py-1.5"
                              onChange={(event) =>
                                setBanDrafts({
                                  ...banDrafts,
                                  [user.username]: {
                                    ...draft,
                                    reason: event.target.value,
                                  },
                                })
                              }
                              placeholder="Optional reason"
                              value={draft.reason}
                            />
                          </td>
                          <td>
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                              <button className={`${actionBtnBase} !px-3 !py-1.5 bg-emerald-500 text-emerald-950 hover:bg-emerald-400`} onClick={() => handleUserStatus(user, "approved")} type="button">
                                Approve
                              </button>
                              <button className={`${actionBtnBase} !px-3 !py-1.5 border border-amber-500/30 text-amber-200 hover:bg-amber-500/10`} onClick={() => handleUserStatus(user, "revoked")} type="button">
                                Revoke
                              </button>
                              <button className={`${actionBtnBase} !px-3 !py-1.5 bg-red-500 text-white hover:bg-red-400`} onClick={() => handleBanUser(user)} type="button">
                                Ban
                              </button>
                              <button className={`${actionBtnBase} !px-3 !py-1.5 border border-white/10 text-zinc-200 hover:bg-white/[0.06]`} onClick={() => handleUnbanUser(user)} type="button">
                                Unban
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length > ADMIN_PREVIEW_LIMIT && (
                <div className="mt-4 flex justify-center">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowAllUsers((current) => !current)}
                    type="button"
                  >
                    {showAllUsers
                      ? "Show less"
                      : `View more (${filteredUsers.length - ADMIN_PREVIEW_LIMIT})`}
                  </button>
                </div>
              )}
            </>
          )}
        </SectionShell>

        <SectionShell
          eyebrow="Review"
          title="Submission Review"
          description="Edit scores, soft-delete, or restore validated submissions."
        >
          <label className="block max-w-sm text-sm text-zinc-300">
            <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Search submissions
            </span>
            <input
              className="input mt-2 !min-h-11 !rounded-xl !bg-white/[0.045]"
              onChange={(event) => setSubmissionSearch(event.target.value)}
              placeholder="username or day"
              value={submissionSearch}
            />
          </label>

          {submissionsLoading && (
            <div className="mt-4 flex items-center gap-3 text-sm text-zinc-400">
              <span className="spinner" />
              Loading submissions...
            </div>
          )}
          {submissionsError && (
            <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submissionsError}
            </p>
          )}
          {!submissionsLoading && !submissionsError && filteredSubmissions.length === 0 && (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-12 text-center">
              <p className="text-sm text-zinc-400">No submissions found.</p>
            </div>
          )}
          {!submissionsLoading && !submissionsError && filteredSubmissions.length > 0 && (
            <>
              <div className="mt-4 grid gap-3 md:hidden">
                {visibleSubmissions.map((submission) => {
                  const isEditing = editingSubmissionId === submission.id;
                  const status = getSubmissionStatus(submission);

                  return (
                    <article
                      className={`queue-card min-w-0 rounded-2xl p-4 ${
                        status === "deleted" ? "opacity-60" : ""
                      }`}
                      key={submission.id}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="break-words font-semibold text-white">
                            {submission.username}
                          </h4>
                          <p className="mt-1 text-xs text-zinc-500">
                            {submission.dayKey} - {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                        <StatusBadge status={status} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                          <p className="text-xs text-zinc-500">Score</p>
                          {isEditing ? (
                            <input
                              className="input mt-1"
                              max={100}
                              min={0}
                              onChange={(event) => setScoreDraft(event.target.value)}
                              type="number"
                              value={scoreDraft}
                            />
                          ) : (
                            <p className="mt-1 font-bold text-emerald-400">
                              {submission.calculatedScore}/100
                            </p>
                          )}
                        </div>
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                          <p className="text-xs text-zinc-500">Validation</p>
                          <p className="mt-1 font-semibold text-zinc-100">
                            {submission.validated ? "Validated" : "Failed"}
                          </p>
                        </div>
                      </div>

                      {submission.editedByAdmin && !isEditing && (
                        <p className="mt-3 text-xs text-amber-300">
                          Edited by admin
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {isEditing ? (
                          <>
                            <button className={`${actionBtnBase} bg-emerald-500 text-emerald-950 hover:bg-emerald-400`} onClick={() => handleEditScore(submission)} type="button">
                              Save
                            </button>
                            <button className={`${actionBtnBase} border border-white/10 text-zinc-200 hover:bg-white/[0.06]`} onClick={() => setEditingSubmissionId("")} type="button">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button className={`${actionBtnBase} border border-sky-500/30 text-sky-200 hover:bg-sky-500/10`} onClick={() => {
                            setEditingSubmissionId(submission.id ?? "");
                            setScoreDraft(String(submission.calculatedScore));
                          }} type="button">
                            Edit Score
                          </button>
                        )}
                        {status === "deleted" ? (
                          <button className={`${actionBtnBase} border border-white/10 text-zinc-200 hover:bg-white/[0.06]`} onClick={() => handleDeleteRestore(submission, false)} type="button">
                            Restore
                          </button>
                        ) : (
                          <button className={`${actionBtnBase} bg-red-500 text-white hover:bg-red-400`} onClick={() => handleDeleteRestore(submission, true)} type="button">
                            Delete
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="queue-table-wrap mt-5 hidden max-w-full overflow-x-auto rounded-2xl md:block">
                <table className="pro-table admin-queue-table min-w-[980px]">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Day</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSubmissions.map((submission) => {
                      const isEditing = editingSubmissionId === submission.id;
                      const status = getSubmissionStatus(submission);

                      return (
                        <tr className={status === "deleted" ? "opacity-50" : ""} key={submission.id}>
                          <td className="font-medium text-white">{submission.username}</td>
                          <td>{submission.dayKey}</td>
                          <td>
                            {isEditing ? (
                              <input
                                className="input !w-24 !py-1.5"
                                max={100}
                                min={0}
                                onChange={(event) => setScoreDraft(event.target.value)}
                                type="number"
                                value={scoreDraft}
                              />
                            ) : (
                              <span>
                                {submission.calculatedScore}/100{" "}
                                {submission.editedByAdmin && (
                                  <span className="text-xs text-amber-300">edited</span>
                                )}
                              </span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={status} />
                          </td>
                          <td>{formatDate(submission.submittedAt)}</td>
                          <td>
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                              {isEditing ? (
                                <>
                                  <button className={`${actionBtnBase} !px-3 !py-1.5 bg-emerald-500 text-emerald-950 hover:bg-emerald-400`} onClick={() => handleEditScore(submission)} type="button">
                                    Save
                                  </button>
                                  <button className={`${actionBtnBase} !px-3 !py-1.5 border border-white/10 text-zinc-200 hover:bg-white/[0.06]`} onClick={() => setEditingSubmissionId("")} type="button">
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button className={`${actionBtnBase} !px-3 !py-1.5 border border-sky-500/30 text-sky-200 hover:bg-sky-500/10`} onClick={() => {
                                  setEditingSubmissionId(submission.id ?? "");
                                  setScoreDraft(String(submission.calculatedScore));
                                }} type="button">
                                  Edit Score
                                </button>
                              )}
                              {status === "deleted" ? (
                                <button className={`${actionBtnBase} !px-3 !py-1.5 border border-white/10 text-zinc-200 hover:bg-white/[0.06]`} onClick={() => handleDeleteRestore(submission, false)} type="button">
                                  Restore
                                </button>
                              ) : (
                                <button className={`${actionBtnBase} !px-3 !py-1.5 bg-red-500 text-white hover:bg-red-400`} onClick={() => handleDeleteRestore(submission, true)} type="button">
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredSubmissions.length > ADMIN_PREVIEW_LIMIT && (
                <div className="mt-4 flex justify-center">
                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      setShowAllSubmissions((current) => !current)
                    }
                    type="button"
                  >
                    {showAllSubmissions
                      ? "Show less"
                      : `View more (${filteredSubmissions.length - ADMIN_PREVIEW_LIMIT})`}
                  </button>
                </div>
              )}
            </>
          )}
        </SectionShell>

        <SectionShell
          eyebrow="History"
          title="Activity Logs"
          description="A chronological record of moderation actions."
        >
          {logsLoading && (
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="spinner" />
              Loading logs...
            </div>
          )}
          {logsError && (
            <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {logsError}
            </p>
          )}
          {!logsLoading && !logsError && logs.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-12 text-center">
              <p className="text-sm text-zinc-400">No moderation activity yet.</p>
            </div>
          )}
          <div className="max-h-[420px] divide-y divide-white/[0.06] overflow-y-auto rounded-xl border border-white/[0.07] pr-1">
            {logs.map((log) => (
              <div className="grid gap-1 px-4 py-3.5 text-sm sm:grid-cols-[180px_1fr_180px]" key={log.id}>
                <p className="font-semibold capitalize text-zinc-200">{log.actionType.replaceAll("_", " ")}</p>
                <p className="text-zinc-400">
                  <span className="text-white">{log.targetUsername}</span> - {log.details}
                </p>
                <p className="text-zinc-500">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          eyebrow="Content"
          title="Prompt Manager"
          description="Edit the active prompt. The parser depends on the structured scorecard block."
        >
          <form className="min-w-0" onSubmit={handleSavePrompt}>
            {promptLoading && (
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <span className="spinner" />
                Loading prompt...
              </div>
            )}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4 text-sm text-amber-100">
              <p className="font-semibold">Scorecard format is required.</p>
              <p className="mt-1 text-amber-100/80">
                The parser depends on exact scorecard keys inside
                BEGIN_SCORECARD and END_SCORECARD. Keep the structured block at
                the top of the prompt output requirements.
              </p>
              <button
                className="btn btn-ghost mt-3 !min-h-9 !px-3 !text-xs !text-amber-100"
                onClick={handleUseStructuredDefault}
                type="button"
              >
                Load Structured Default
              </button>
            </div>
            <details className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-200">
                Expected AI Output Format
              </summary>
              <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-white/[0.07] bg-[var(--surface-0)] p-3 font-mono text-xs leading-5 text-zinc-300">
                {EXPECTED_SCORECARD_FORMAT}
              </pre>
            </details>
            <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
              Title
              <input className="input" onChange={(event) => setTitle(event.target.value)} value={titleValue} />
            </label>
            <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
              Version
              <input className="input" min={1} onChange={(event) => setVersion(Number(event.target.value))} type="number" value={versionValue} />
            </label>
            <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
              Content
              <textarea className="input min-h-80 resize-y font-mono leading-6" onChange={(event) => setContent(event.target.value)} value={contentValue} />
            </label>
            <button className="btn btn-save-prompt mt-5 w-full sm:w-auto" disabled={saving} type="submit">
              {saving && <span className="spinner !h-4 !w-4 !border-emerald-950/40 !border-t-emerald-950" />}
              {saving ? "Saving..." : "Save Active Prompt"}
            </button>
          </form>
        </SectionShell>
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
