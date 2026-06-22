"use client";

import { Dispatch, SetStateAction } from "react";
import { AdminScoreMap } from "@/services/adminScoreService";
import { getEffectiveUserStatus } from "@/services/moderationUtils";
import { UserProfileWithId, UserStatus } from "@/types/user";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Timestamp } from "firebase/firestore";

type BanDrafts = Record<string, { until: string; reason: string }>;

type AdminModerationQueueProps = {
  filteredUsers: UserProfileWithId[];
  visibleUsers: UserProfileWithId[];
  usersLoading: boolean;
  usersError: string;
  scores: AdminScoreMap;
  scoresLoading: boolean;
  scoresError: string;
  userSearch: string;
  setUserSearch: (value: string) => void;
  showAllUsers: boolean;
  setShowAllUsers: Dispatch<SetStateAction<boolean>>;
  banDrafts: BanDrafts;
  setBanDrafts: Dispatch<SetStateAction<BanDrafts>>;
  previewLimit: number;
  onUserStatus: (user: UserProfileWithId, status: UserStatus) => void;
  onBanUser: (user: UserProfileWithId) => void;
  onUnbanUser: (user: UserProfileWithId) => void;
};

const actionBtnBase =
  "rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

function toLocalInputValue(timestamp?: Timestamp | null) {
  if (!timestamp) {
    return "";
  }

  const date = timestamp.toDate();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function AdminModerationQueue({
  filteredUsers,
  visibleUsers,
  usersLoading,
  usersError,
  scores,
  scoresLoading,
  scoresError,
  userSearch,
  setUserSearch,
  showAllUsers,
  setShowAllUsers,
  banDrafts,
  setBanDrafts,
  previewLimit,
  onUserStatus,
  onBanUser,
  onUnbanUser,
}: AdminModerationQueueProps) {
  return (
    <AdminSectionShell
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
                    <button
                      className={`${actionBtnBase} bg-emerald-500 text-emerald-950 hover:bg-emerald-400`}
                      onClick={() => onUserStatus(user, "approved")}
                      type="button"
                    >
                      Approve
                    </button>
                    <button
                      className={`${actionBtnBase} border border-amber-500/30 text-amber-200 hover:bg-amber-500/10`}
                      onClick={() => onUserStatus(user, "revoked")}
                      type="button"
                    >
                      Revoke
                    </button>
                    <button
                      className={`${actionBtnBase} bg-red-500 text-white hover:bg-red-400`}
                      onClick={() => onBanUser(user)}
                      type="button"
                    >
                      Ban
                    </button>
                    <button
                      className={`${actionBtnBase} border border-white/10 text-zinc-200 hover:bg-white/[0.06]`}
                      onClick={() => onUnbanUser(user)}
                      type="button"
                    >
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
                      <td className="font-medium text-white">{user.username}</td>
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
                          <button
                            className={`${actionBtnBase} !px-3 !py-1.5 bg-emerald-500 text-emerald-950 hover:bg-emerald-400`}
                            onClick={() => onUserStatus(user, "approved")}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className={`${actionBtnBase} !px-3 !py-1.5 border border-amber-500/30 text-amber-200 hover:bg-amber-500/10`}
                            onClick={() => onUserStatus(user, "revoked")}
                            type="button"
                          >
                            Revoke
                          </button>
                          <button
                            className={`${actionBtnBase} !px-3 !py-1.5 bg-red-500 text-white hover:bg-red-400`}
                            onClick={() => onBanUser(user)}
                            type="button"
                          >
                            Ban
                          </button>
                          <button
                            className={`${actionBtnBase} !px-3 !py-1.5 border border-white/10 text-zinc-200 hover:bg-white/[0.06]`}
                            onClick={() => onUnbanUser(user)}
                            type="button"
                          >
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
          {filteredUsers.length > previewLimit && (
            <div className="mt-4 flex justify-center">
              <button
                className="btn btn-ghost"
                onClick={() => setShowAllUsers((current) => !current)}
                type="button"
              >
                {showAllUsers
                  ? "Show less"
                  : `View more (${filteredUsers.length - previewLimit})`}
              </button>
            </div>
          )}
        </>
      )}
    </AdminSectionShell>
  );
}
