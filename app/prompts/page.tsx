"use client";

import Link from "next/link";
import { ActivePromptCard } from "@/components/ActivePromptCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useActivePrompt } from "@/hooks/useActivePrompt";

function PromptsContent() {
  const { prompt, loading, error, reload } = useActivePrompt();

  return (
    <main className="min-h-screen px-4 py-8 text-zinc-50 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Prompt Center</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Current Prompt
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              The official prompt used for consistent scoring across all
              submissions.
            </p>
          </div>

          <Link
            className="btn btn-ghost shrink-0"
            href="/dashboard"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M15 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </Link>
        </header>

        {loading && (
          <div className="card p-6">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <span className="spinner" />
              Loading active prompt...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="card border-red-500/25 p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                !
              </span>
              <div className="flex-1">
                <p className="text-sm text-red-200">{error}</p>
                <button
                  className="btn btn-ghost mt-4 !min-h-9 !px-3 !text-xs"
                  onClick={reload}
                  type="button"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && prompt && <ActivePromptCard prompt={prompt} />}

        {!loading && !error && !prompt && (
          <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-400">
              <svg
                aria-hidden="true"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <h2 className="font-semibold text-white">No active prompt</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Create and activate a prompt document in Firestore to show it
                here.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default function PromptsPage() {
  return (
    <ProtectedRoute>
      <PromptsContent />
    </ProtectedRoute>
  );
}
