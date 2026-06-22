"use client";

import { Dispatch, SetStateAction } from "react";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { StatusBadge } from "@/components/StatusBadge";
import { getSubmissionStatus } from "@/services/moderationUtils";
import { Submission } from "@/types/submission";
import { formatDate } from "@/utils/formatDate";

type AdminSubmissionReviewProps = {
  filteredSubmissions: Submission[];
  visibleSubmissions: Submission[];
  submissionsLoading: boolean;
  submissionsError: string;
  submissionSearch: string;
  setSubmissionSearch: (value: string) => void;
  showAllSubmissions: boolean;
  setShowAllSubmissions: Dispatch<SetStateAction<boolean>>;
  editingSubmissionId: string;
  setEditingSubmissionId: (id: string) => void;
  scoreDraft: string;
  setScoreDraft: (value: string) => void;
  previewLimit: number;
  onEditScore: (submission: Submission) => void;
  onDeleteRestore: (submission: Submission, deleted: boolean) => void;
};

const actionBtnBase =
  "rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export function AdminSubmissionReview({
  filteredSubmissions,
  visibleSubmissions,
  submissionsLoading,
  submissionsError,
  submissionSearch,
  setSubmissionSearch,
  showAllSubmissions,
  setShowAllSubmissions,
  editingSubmissionId,
  setEditingSubmissionId,
  scoreDraft,
  setScoreDraft,
  previewLimit,
  onEditScore,
  onDeleteRestore,
}: AdminSubmissionReviewProps) {
  return (
    <AdminSectionShell
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
      {!submissionsLoading &&
        !submissionsError &&
        filteredSubmissions.length === 0 && (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-12 text-center">
            <p className="text-sm font-semibold text-zinc-200">
              No submissions need review.
            </p>
            <p className="max-w-md text-sm text-zinc-500">
              Submission entry is for users. Admins can review and moderate
              incoming scorecards here when they arrive.
            </p>
          </div>
        )}
      {!submissionsLoading &&
        !submissionsError &&
        filteredSubmissions.length > 0 && (
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
                          {submission.dayKey} -{" "}
                          {formatDate(submission.submittedAt, {
                            includeTime: true,
                          })}
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
                            onChange={(event) =>
                              setScoreDraft(event.target.value)
                            }
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
                          <button
                            className={`${actionBtnBase} bg-emerald-500 text-emerald-950 hover:bg-emerald-400`}
                            onClick={() => onEditScore(submission)}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className={`${actionBtnBase} border border-white/10 text-zinc-200 hover:bg-white/[0.06]`}
                            onClick={() => setEditingSubmissionId("")}
                            type="button"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className={`${actionBtnBase} border border-sky-500/30 text-sky-200 hover:bg-sky-500/10`}
                          onClick={() => {
                            setEditingSubmissionId(submission.id ?? "");
                            setScoreDraft(String(submission.calculatedScore));
                          }}
                          type="button"
                        >
                          Edit Score
                        </button>
                      )}
                      {status === "deleted" ? (
                        <button
                          className={`${actionBtnBase} border border-white/10 text-zinc-200 hover:bg-white/[0.06]`}
                          onClick={() => onDeleteRestore(submission, false)}
                          type="button"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          className={`${actionBtnBase} bg-red-500 text-white hover:bg-red-400`}
                          onClick={() => onDeleteRestore(submission, true)}
                          type="button"
                        >
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
                      <tr
                        className={status === "deleted" ? "opacity-50" : ""}
                        key={submission.id}
                      >
                        <td className="font-medium text-white">
                          {submission.username}
                        </td>
                        <td>{submission.dayKey}</td>
                        <td>
                          {isEditing ? (
                            <input
                              className="input !w-24 !py-1.5"
                              max={100}
                              min={0}
                              onChange={(event) =>
                                setScoreDraft(event.target.value)
                              }
                              type="number"
                              value={scoreDraft}
                            />
                          ) : (
                            <span>
                              {submission.calculatedScore}/100{" "}
                              {submission.editedByAdmin && (
                                <span className="text-xs text-amber-300">
                                  edited
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={status} />
                        </td>
                        <td>
                          {formatDate(submission.submittedAt, {
                            includeTime: true,
                          })}
                        </td>
                        <td>
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            {isEditing ? (
                              <>
                                <button
                                  className={`${actionBtnBase} !px-3 !py-1.5 bg-emerald-500 text-emerald-950 hover:bg-emerald-400`}
                                  onClick={() => onEditScore(submission)}
                                  type="button"
                                >
                                  Save
                                </button>
                                <button
                                  className={`${actionBtnBase} !px-3 !py-1.5 border border-white/10 text-zinc-200 hover:bg-white/[0.06]`}
                                  onClick={() => setEditingSubmissionId("")}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                className={`${actionBtnBase} !px-3 !py-1.5 border border-sky-500/30 text-sky-200 hover:bg-sky-500/10`}
                                onClick={() => {
                                  setEditingSubmissionId(submission.id ?? "");
                                  setScoreDraft(
                                    String(submission.calculatedScore),
                                  );
                                }}
                                type="button"
                              >
                                Edit Score
                              </button>
                            )}
                            {status === "deleted" ? (
                              <button
                                className={`${actionBtnBase} !px-3 !py-1.5 border border-white/10 text-zinc-200 hover:bg-white/[0.06]`}
                                onClick={() => onDeleteRestore(submission, false)}
                                type="button"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                className={`${actionBtnBase} !px-3 !py-1.5 bg-red-500 text-white hover:bg-red-400`}
                                onClick={() => onDeleteRestore(submission, true)}
                                type="button"
                              >
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
            {filteredSubmissions.length > previewLimit && (
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
                    : `View more (${filteredSubmissions.length - previewLimit})`}
                </button>
              </div>
            )}
          </>
        )}
    </AdminSectionShell>
  );
}
