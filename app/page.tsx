"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { useActivePrompt } from "@/hooks/useActivePrompt";
import { useAuth } from "@/hooks/useAuth";
import { useDailySubmission } from "@/hooks/useDailySubmission";
import { createSubmission } from "@/services/submissionService";

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) {
    return "Just now";
  }

  return timestamp.toDate().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Home() {
  const { profile, loading: authLoading } = useAuth();
  const { prompt, loading: promptLoading, error: promptError } = useActivePrompt();
  const canSubmit = Boolean(profile?.approved);
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

  const submissionLocked = hasSubmittedToday || dailySubmissionLoading;

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
      showTemporaryMessage(setCopyMessage, "Copied!");
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
      setSubmissionMessage(
        error instanceof Error ? error.message : "Could not submit response.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-200">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Home
          </p>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Copy the prompt, run it in your AI, and submit your score.
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              The leaderboard uses the average of every validated submission, so
              today&apos;s score becomes part of your long-term ranking.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm shadow-black/20">
            <div className="flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-zinc-400">Official prompt</p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {prompt?.title ?? "Prompt"}
                </h2>
                {prompt && (
                  <p className="mt-2 text-sm text-zinc-500">
                    Version v{prompt.version} - Updated {formatDate(prompt.updatedAt)}
                  </p>
                )}
              </div>
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
                <pre className="max-h-[400px] overflow-y-auto scroll-smooth whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-100">
                  {prompt.content}
                </pre>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                className="w-full cursor-pointer rounded-md bg-zinc-100 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-300 active:bg-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 sm:w-auto"
                disabled={!prompt}
                onClick={handleCopyPrompt}
                type="button"
              >
                Copy Prompt
              </button>
              {copyMessage && (
                <p className="text-sm font-medium text-zinc-300">{copyMessage}</p>
              )}
            </div>
          </article>

          <form
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm shadow-black/20"
            onSubmit={handleSubmitResponse}
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm text-zinc-400">Score submission</p>
              <h2 className="text-2xl font-bold text-white">Paste AI Output</h2>
              {!canSubmit && (
                <p className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                  {authLoading
                    ? "Checking your account..."
                    : profile
                      ? "Your account is waiting for admin approval. You can view the leaderboard while you wait."
                      : "Log in with an approved account to submit scores."}
                </p>
              )}
              {hasSubmittedToday && (
                <p className="rounded-md border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                  Your result was submitted today. Come back tomorrow after
                  reset time.
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-zinc-300">
                Response text
              </label>
              <div className="flex items-center gap-2">
                <button
                  className="cursor-pointer rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 active:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canSubmit || submissionLocked}
                  onClick={handlePasteFromClipboard}
                  type="button"
                >
                  Paste
                </button>
                {pasteMessage && (
                  <span className="text-xs text-zinc-400">{pasteMessage}</span>
                )}
              </div>
            </div>

            <textarea
              className="mt-2 min-h-72 w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm leading-6 text-zinc-50 outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSubmit || submissionLocked}
              onChange={(event) => setResponseText(event.target.value)}
              placeholder="Paste the response you got from ChatGPT, Gemini, Claude, or another AI tool."
              value={responseText}
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                accept=".txt,text/plain"
                className="text-sm text-zinc-300 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950 file:transition file:hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSubmit || submissionLocked}
                onChange={handleFileUpload}
                type="file"
              />

              <button
                className="cursor-pointer rounded-md bg-emerald-500 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-400 active:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                disabled={!canSubmit || submitting || submissionLocked}
                type="submit"
              >
                {submitting ? "Submitting..." : "Submit Score"}
              </button>
            </div>

            {submissionMessage && (
              <p className="mt-4 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200">
                {submissionMessage}
              </p>
            )}

            {!profile && !authLoading && (
              <Link
                className="mt-4 inline-flex cursor-pointer rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800 active:bg-zinc-700"
                href="/login"
              >
                Login / Signup
              </Link>
            )}
          </form>
        </div>

        <section className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300 sm:grid-cols-3">
          {["Copy", "Run in AI", "Paste & Submit"].map((step, index) => (
            <div className="flex items-center gap-3" key={step}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 font-bold text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
