"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { AppToast } from "@/components/AppToast";
import { StatusBadge } from "@/components/StatusBadge";
import { useActivePrompt } from "@/hooks/useActivePrompt";
import { useAuth } from "@/hooks/useAuth";
import { useDailySubmission } from "@/hooks/useDailySubmission";
import { ScoreValidationError } from "@/services/analysisService";
import {
  getEffectiveUserStatus,
  isUserCurrentlyBanned,
} from "@/services/moderationUtils";
import { createSubmission } from "@/services/submissionService";
import { formatDate } from "@/utils/formatDate";

export function SubmissionSection() {
  const { profile, loading: authLoading } = useAuth();
  const { prompt, loading: promptLoading, error: promptError } = useActivePrompt();
  const userStatus = getEffectiveUserStatus(profile);
  const canSubmit = userStatus === "approved";
  const isBanned = isUserCurrentlyBanned(profile);
  const {
    hasSubmittedToday,
    loading: dailySubmissionLoading,
    reload: reloadDailySubmission,
  } = useDailySubmission(canSubmit ? profile?.username : undefined);
  const [responseText, setResponseText] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionLocked = hasSubmittedToday || dailySubmissionLoading || !canSubmit;
  const banUntilText = profile?.bannedUntil
    ? profile.bannedUntil.toDate().toLocaleString()
    : null;

  const showTemporaryMessage = (
    setter: (message: string) => void,
    message: string,
  ) => {
    setter(message);
    window.setTimeout(() => setter(""), 1800);
  };

  const handleCopyPrompt = async () => {
    if (!prompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt.content);
      showTemporaryMessage(setCopyMessage, "Prompt copied");
    } catch {
      showTemporaryMessage(setCopyMessage, "Could not copy prompt.");
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setResponseText(text);
      showTemporaryMessage(setPasteMessage, "Pasted!");
    } catch {
      showTemporaryMessage(
        setPasteMessage,
        "Clipboard access was blocked. You can still paste manually.",
      );
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type && file.type !== "text/plain") {
      setSubmissionMessage("Upload a .txt file.");
      return;
    }

    try {
      const text = await file.text();
      setResponseText(text);
      setSubmissionMessage("Text file loaded.");
    } catch {
      setSubmissionMessage("Could not read that file.");
    }
  };

  const handleSubmitResponse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionMessage("");

    if (!profile) {
      setSubmissionMessage("Log in before submitting a response.");
      return;
    }

    if (!prompt) {
      setSubmissionMessage("No active prompt is available.");
      return;
    }

    try {
      setSubmitting(true);
      const submission = await createSubmission({
        username: profile.username,
        promptId: prompt.id,
        promptVersion: prompt.version,
        responseText,
      });
      setResponseText("");
      await reloadDailySubmission();
      setSubmissionMessage(
        `Response submitted and scored. Your score: ${submission.calculatedScore}/100.`,
      );
    } catch (error) {
      if (error instanceof ScoreValidationError) {
        setSubmissionMessage(error.message);
        return;
      }

      setSubmissionMessage(
        error instanceof Error ? error.message : "Could not submit response.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8"
      id="submission"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Submit scorecard
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Turn an AI response into validated progress.
          </h2>
        </div>

        <div className="grid gap-5">
          <article className="min-w-0 self-start rounded-2xl border border-white/15 bg-zinc-900/80 p-5 shadow-lg shadow-black/30 sm:bg-white/[0.04] sm:p-6">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-400">
                  Official Prompt
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  {prompt?.title ?? "Prompt"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Use this exact prompt for consistent scoring.
                </p>
                {prompt && (
                  <p className="mt-2 break-words text-xs text-zinc-500">
                    Version v{prompt.version} - Updated{" "}
                    {formatDate(prompt.updatedAt, { fallback: "Just now" })}
                  </p>
                )}
              </div>
              <button
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-zinc-100 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 sm:w-auto"
                disabled={!prompt}
                onClick={handleCopyPrompt}
                type="button"
              >
                Copy Prompt
              </button>
            </div>

            <div className="mt-5">
              {promptLoading && (
                <p className="text-sm text-zinc-400">Loading prompt...</p>
              )}

              {!promptLoading && promptError && (
                <p className="text-sm text-red-200">{promptError}</p>
              )}

              {!promptLoading && !promptError && !prompt && (
                <p className="text-sm text-zinc-400">
                  No active prompt is available yet.
                </p>
              )}

              {prompt && (
                <details className="group rounded-xl border border-white/10 bg-zinc-950/70">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:text-white">
                    View full prompt
                    <span className="text-zinc-500 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <pre className="max-h-80 max-w-full overflow-y-auto overflow-x-hidden border-t border-white/10 p-4 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200 [overflow-wrap:anywhere]">
                    {prompt.content}
                  </pre>
                </details>
              )}
            </div>

            {copyMessage && copyMessage !== "Prompt copied" && (
              <p className="mt-4 text-sm font-medium text-red-200">
                {copyMessage}
              </p>
            )}
          </article>

          <form
            className="min-w-0 rounded-2xl border border-white/15 bg-zinc-900/80 p-5 shadow-lg shadow-black/30 sm:bg-white/[0.04] sm:p-6"
            onSubmit={handleSubmitResponse}
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-400">
                Paste AI Output
              </p>
              <h3 className="text-xl font-semibold text-white">
                Submit the validated scorecard
              </h3>
              <p className="text-sm leading-6 text-zinc-400">
                Paste the response from your external AI tool here.
              </p>
              {profile && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-zinc-400">Account status</span>
                  <StatusBadge status={userStatus} />
                </div>
              )}
              {!canSubmit && (
                <p className="rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-400">
                  {authLoading
                    ? "Checking your account..."
                    : profile
                      ? isBanned
                        ? `Your account is temporarily banned${banUntilText ? ` until ${banUntilText}` : ""}.${profile.banReason ? ` Reason: ${profile.banReason}` : ""}`
                        : userStatus === "pending"
                          ? "Your account is pending approval. You can view the leaderboard while you wait."
                          : "Your account access has been revoked. You can still view the leaderboard."
                      : "Log in with an approved account to submit scores."}
                </p>
              )}
              {hasSubmittedToday && (
                <p className="rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                  Your result was submitted today. Come back tomorrow after
                  reset time.
                </p>
              )}
            </div>

            <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-medium text-zinc-300">
                Response text
              </label>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <button
                  className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canSubmit || submissionLocked}
                  onClick={handlePasteFromClipboard}
                  type="button"
                >
                  Paste
                </button>
                {pasteMessage && (
                  <span className="break-words text-xs text-zinc-400">
                    {pasteMessage}
                  </span>
                )}
              </div>
            </div>

            <textarea
              className="mt-2 min-h-48 w-full max-w-full resize-y rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm leading-6 text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSubmit || submissionLocked}
              onChange={(event) => setResponseText(event.target.value)}
              placeholder="Paste the response you got from ChatGPT, Gemini, Claude, or another AI tool."
              value={responseText}
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                accept=".txt,text/plain"
                className="w-full max-w-full min-w-0 text-sm text-zinc-300 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-white/[0.08] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-100 file:transition file:hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                disabled={!canSubmit || submissionLocked}
                onChange={handleFileUpload}
                type="file"
              />

              <button
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-500 px-5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
                disabled={!canSubmit || submitting || submissionLocked}
                type="submit"
              >
                {submitting ? "Submitting..." : "Submit Score"}
              </button>
            </div>

            <p className="mt-4 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-400">
              Analytics and score history are available in your dashboard.
            </p>

            {submissionMessage && (
              <p className="mt-4 rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-200">
                {submissionMessage}
              </p>
            )}

            {!profile && !authLoading && (
              <Link
                className="mt-4 inline-flex cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.06]"
                href="/login"
              >
                Login / Signup
              </Link>
            )}
          </form>
        </div>
      </div>

      <AppToast message={copyMessage === "Prompt copied" ? copyMessage : ""} />
    </section>
  );
}
