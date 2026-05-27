"use client";

import Link from "next/link";
import { ActivePromptCard } from "@/components/ActivePromptCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useActivePrompt } from "@/hooks/useActivePrompt";

function PromptsContent() {
  const { prompt, loading, error, reload } = useActivePrompt();

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Prompt Center
            </p>
            <h1 className="mt-1 text-3xl font-semibold">Current Prompt</h1>
          </div>

          <Link
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950"
            href="/dashboard"
          >
            Dashboard
          </Link>
        </header>

        {loading && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Loading active prompt...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-5">
            <p className="text-sm text-red-200">{error}</p>
            <button
              className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-semibold text-red-950"
              onClick={reload}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && prompt && <ActivePromptCard prompt={prompt} />}

        {!loading && !error && !prompt && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="font-semibold">No active prompt</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Create and activate a prompt document in Firestore to show it
              here.
            </p>
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
