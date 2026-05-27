"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { LeaderboardPreview } from "@/components/LeaderboardPreview";
import { useActivePrompt } from "@/hooks/useActivePrompt";
import { useAuth } from "@/hooks/useAuth";
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
  const [responseText, setResponseText] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCopyPrompt = async () => {
    if (!prompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopyMessage("Prompt copied.");
    } catch {
      setCopyMessage("Could not copy prompt.");
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
      await createSubmission({
        username: profile.username,
        promptId: prompt.id,
        promptVersion: prompt.version,
        responseText,
      });
      setResponseText("");
      setSubmissionMessage("Response submitted and scored.");
    } catch (error) {
      setSubmissionMessage(
        error instanceof Error ? error.message : "Could not submit response.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Daily AI Response Challenge
            </p>
            <h1 className="mt-1 text-3xl font-semibold">
              Copy the prompt, paste your AI response.
            </h1>
          </div>

          <div className="flex gap-3">
            {authLoading ? (
              <p className="text-sm text-zinc-400">Checking session...</p>
            ) : profile ? (
              <Link
                className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950"
                href="/dashboard"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100"
                  href="/login"
                >
                  Login
                </Link>
                <Link
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
                  href="/login"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="flex flex-col gap-6">
            <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
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
                <>
                  <div className="flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">
                        Version v{prompt.version} - Created{" "}
                        {formatDate(prompt.createdAt)}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">
                        {prompt.title}
                      </h2>
                    </div>

                    <button
                      className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
                      onClick={handleCopyPrompt}
                      type="button"
                    >
                      Copy Prompt
                    </button>
                  </div>

                  <pre className="mt-5 whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-100">
                    {prompt.content}
                  </pre>

                  {copyMessage && (
                    <p className="mt-3 text-sm text-zinc-300">{copyMessage}</p>
                  )}
                </>
              )}
            </article>

            {profile ? (
              <form
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
                onSubmit={handleSubmitResponse}
              >
                <h2 className="text-xl font-semibold">Submit AI Response</h2>
                <textarea
                  className="mt-4 min-h-64 w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-50 outline-none focus:border-emerald-400"
                  onChange={(event) => setResponseText(event.target.value)}
                  placeholder="Paste the response you got from ChatGPT, Gemini, or another AI tool."
                  value={responseText}
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <input
                    accept=".txt,text/plain"
                    className="text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950"
                    onChange={handleFileUpload}
                    type="file"
                  />

                  <button
                    className="rounded-md bg-emerald-500 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? "Submitting..." : "Submit Response"}
                  </button>
                </div>

                {submissionMessage && (
                  <p className="mt-3 text-sm text-zinc-300">
                    {submissionMessage}
                  </p>
                )}
              </form>
            ) : (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
                <h2 className="text-xl font-semibold">Submit your response</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Log in or sign up to paste your AI response and save it for
                  scoring.
                </p>
              </div>
            )}
          </section>

          <LeaderboardPreview />
        </div>
      </section>
    </main>
  );
}
