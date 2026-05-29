"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
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
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

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
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");
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
      setMessage("Active prompt saved.");
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
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 px-4 py-6 text-zinc-50 sm:px-6 sm:py-8">
      <section className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-400">Admin</p>
            <h1 className="mt-1 break-words text-3xl font-semibold">
              Admin Control Center
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Manage users, prompts, moderation, and analytics.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className="w-full rounded-md border border-zinc-700 px-4 py-2 text-center text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800 sm:w-auto"
              href="/"
            >
              Homepage
            </Link>
            <button
              className="w-full rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-300 sm:w-auto"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        {message && (
          <p className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
            {message}
          </p>
        )}
        {statsError && <p className="text-sm text-red-200">{statsError}</p>}

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Users" value={statsLoading ? "..." : stats?.totalUsers ?? 0} />
          <MetricCard label="Approved Users" value={statsLoading ? "..." : stats?.approvedUsers ?? 0} positive />
          <MetricCard label="Banned Users" value={statsLoading ? "..." : stats?.bannedUsers ?? 0} />
          <MetricCard label="Pending Users" value={statsLoading ? "..." : stats?.pendingUsers ?? 0} />
          <MetricCard label="Active Submissions" value={statsLoading ? "..." : stats?.activeSubmissions ?? 0} />
          <MetricCard label="Deleted Submissions" value={statsLoading ? "..." : stats?.deletedSubmissions ?? 0} />
          <MetricCard label="Average Platform Score" value={statsLoading ? "..." : `${stats?.averagePlatformScore ?? 0}/100`} />
          <MetricCard label="Today's Average Score" value={statsLoading ? "..." : `${stats?.todaysAverageScore ?? 0}/100`} />
        </div>

        <AdminAnalyticsOverview submissions={submissions} />

        <SectionShell title="Moderation Queue">
          <div className="mt-4">
            <h3 className="text-base font-semibold text-white">
              User Moderation
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Review access status, bans, and user-level score summaries.
            </p>
          </div>
          <label className="mt-4 block max-w-sm text-sm text-zinc-300">
            Search users
            <input
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="username"
              value={userSearch}
            />
          </label>

          {usersLoading && <p className="mt-4 text-sm text-zinc-400">Loading users...</p>}
          {(usersError || scoresError) && (
            <p className="mt-4 text-sm text-red-200">{usersError || scoresError}</p>
          )}
          {!usersLoading && !usersError && filteredUsers.length === 0 && (
            <p className="mt-4 text-sm text-zinc-400">No users found.</p>
          )}
          {!usersLoading && !usersError && filteredUsers.length > 0 && (
            <div className="mt-4 max-w-full overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="sticky top-0 bg-zinc-950 text-zinc-400">
                  <tr>
                    <th className="border-b border-zinc-800 py-2">Username</th>
                    <th className="border-b border-zinc-800 py-2">Status</th>
                    <th className="border-b border-zinc-800 py-2">Average</th>
                    <th className="border-b border-zinc-800 py-2">Ban Until</th>
                    <th className="border-b border-zinc-800 py-2">Reason</th>
                    <th className="border-b border-zinc-800 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const userScore = scores[user.username];
                    const status = getEffectiveUserStatus(user);
                    const draft = banDrafts[user.username] ?? {
                      until: toLocalInputValue(user.bannedUntil),
                      reason: user.banReason ?? "",
                    };

                    return (
                      <tr key={user.id}>
                        <td className="border-b border-zinc-800 py-3 font-medium text-white">
                          {user.username}
                        </td>
                        <td className="border-b border-zinc-800 py-3">
                          <StatusBadge status={status} />
                        </td>
                        <td className="border-b border-zinc-800 py-3">
                          {scoresLoading
                            ? "..."
                            : `${userScore?.averageScore ?? 0}/100 (${userScore?.submissionCount ?? 0})`}
                        </td>
                        <td className="border-b border-zinc-800 py-3">
                          <input
                            className="w-48 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-50"
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
                        <td className="border-b border-zinc-800 py-3">
                          <input
                            className="w-56 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-50"
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
                        <td className="border-b border-zinc-800 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <button className="rounded-md bg-emerald-500 px-3 py-1 font-semibold text-zinc-950 hover:bg-emerald-400" onClick={() => handleUserStatus(user, "approved")} type="button">
                              Approve
                            </button>
                            <button className="rounded-md border border-amber-700/60 px-3 py-1 font-semibold text-amber-100 hover:bg-amber-950/30" onClick={() => handleUserStatus(user, "revoked")} type="button">
                              Revoke
                            </button>
                            <button className="rounded-md bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-500" onClick={() => handleBanUser(user)} type="button">
                              Ban
                            </button>
                            <button className="rounded-md border border-zinc-700 px-3 py-1 font-semibold text-zinc-200 hover:bg-zinc-800" onClick={() => handleUnbanUser(user)} type="button">
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
          )}
        </SectionShell>

        <SectionShell title="Submission Review">
          <label className="mt-4 block max-w-sm text-sm text-zinc-300">
            Search submissions
            <input
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
              onChange={(event) => setSubmissionSearch(event.target.value)}
              placeholder="username or day"
              value={submissionSearch}
            />
          </label>

          {submissionsLoading && <p className="mt-4 text-sm text-zinc-400">Loading submissions...</p>}
          {submissionsError && <p className="mt-4 text-sm text-red-200">{submissionsError}</p>}
          {!submissionsLoading && !submissionsError && filteredSubmissions.length === 0 && (
            <p className="mt-4 text-sm text-zinc-400">No submissions found.</p>
          )}
          {!submissionsLoading && !submissionsError && filteredSubmissions.length > 0 && (
            <div className="mt-4 max-w-full overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="sticky top-0 bg-zinc-950 text-zinc-400">
                  <tr>
                    <th className="border-b border-zinc-800 py-2">User</th>
                    <th className="border-b border-zinc-800 py-2">Day</th>
                    <th className="border-b border-zinc-800 py-2">Score</th>
                    <th className="border-b border-zinc-800 py-2">Status</th>
                    <th className="border-b border-zinc-800 py-2">Submitted</th>
                    <th className="border-b border-zinc-800 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => {
                    const isEditing = editingSubmissionId === submission.id;
                    const status = getSubmissionStatus(submission);

                    return (
                      <tr className={status === "deleted" ? "opacity-50" : ""} key={submission.id}>
                        <td className="border-b border-zinc-800 py-3 font-medium text-white">{submission.username}</td>
                        <td className="border-b border-zinc-800 py-3">{submission.dayKey}</td>
                        <td className="border-b border-zinc-800 py-3">
                          {isEditing ? (
                            <input
                              className="w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-50"
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
                        <td className="border-b border-zinc-800 py-3">
                          <StatusBadge status={status} />
                        </td>
                        <td className="border-b border-zinc-800 py-3">{formatDate(submission.submittedAt)}</td>
                        <td className="border-b border-zinc-800 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            {isEditing ? (
                              <>
                                <button className="rounded-md bg-emerald-500 px-3 py-1 font-semibold text-zinc-950 hover:bg-emerald-400" onClick={() => handleEditScore(submission)} type="button">
                                  Save
                                </button>
                                <button className="rounded-md border border-zinc-700 px-3 py-1 font-semibold text-zinc-200 hover:bg-zinc-800" onClick={() => setEditingSubmissionId("")} type="button">
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button className="rounded-md border border-sky-800/70 px-3 py-1 font-semibold text-sky-100 hover:bg-sky-950/30" onClick={() => {
                                setEditingSubmissionId(submission.id ?? "");
                                setScoreDraft(String(submission.calculatedScore));
                              }} type="button">
                                Edit Score
                              </button>
                            )}
                            {status === "deleted" ? (
                              <button className="rounded-md border border-zinc-700 px-3 py-1 font-semibold text-zinc-200 hover:bg-zinc-800" onClick={() => handleDeleteRestore(submission, false)} type="button">
                                Restore
                              </button>
                            ) : (
                              <button className="rounded-md bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-500" onClick={() => handleDeleteRestore(submission, true)} type="button">
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
          )}
        </SectionShell>

        <SectionShell title="Activity Logs">
          {logsLoading && <p className="mt-4 text-sm text-zinc-400">Loading logs...</p>}
          {logsError && <p className="mt-4 text-sm text-red-200">{logsError}</p>}
          {!logsLoading && !logsError && logs.length === 0 && (
            <p className="mt-4 text-sm text-zinc-400">No moderation activity yet.</p>
          )}
          <div className="mt-4 max-h-[420px] divide-y divide-zinc-800 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div className="grid gap-1 py-3 text-sm sm:grid-cols-[180px_1fr_180px]" key={log.id}>
                <p className="font-semibold capitalize text-zinc-200">{log.actionType.replaceAll("_", " ")}</p>
                <p className="text-zinc-400">
                  <span className="text-white">{log.targetUsername}</span> - {log.details}
                </p>
                <p className="text-zinc-500">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell title="Prompt Manager">
          <form className="min-w-0" onSubmit={handleSavePrompt}>
            {promptLoading && <p className="mt-3 text-sm text-zinc-400">Loading prompt...</p>}
            <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-100">
              <p className="font-semibold">Scorecard format is required.</p>
              <p className="mt-1 text-amber-100/80">
                The parser depends on exact scorecard keys inside
                BEGIN_SCORECARD and END_SCORECARD. Keep the structured block at
                the top of the prompt output requirements.
              </p>
              <button
                className="mt-3 rounded-md border border-amber-700/60 px-3 py-1.5 text-xs font-semibold text-amber-50 transition hover:bg-amber-900/30"
                onClick={handleUseStructuredDefault}
                type="button"
              >
                Load Structured Default
              </button>
            </div>
            <details className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-200">
                Expected AI Output Format
              </summary>
              <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs leading-5 text-zinc-300">
                {EXPECTED_SCORECARD_FORMAT}
              </pre>
            </details>
            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-zinc-200">
              Title
              <input className="w-full max-w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400" onChange={(event) => setTitle(event.target.value)} value={titleValue} />
            </label>
            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-zinc-200">
              Version
              <input className="w-full max-w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400" min={1} onChange={(event) => setVersion(Number(event.target.value))} type="number" value={versionValue} />
            </label>
            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-zinc-200">
              Content
              <textarea className="min-h-80 w-full max-w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-50 outline-none focus:border-emerald-400" onChange={(event) => setContent(event.target.value)} value={contentValue} />
            </label>
            <button className="mt-4 w-full rounded-md bg-emerald-500 px-4 py-2 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save Active Prompt"}
            </button>
          </form>
        </SectionShell>
      </section>
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
