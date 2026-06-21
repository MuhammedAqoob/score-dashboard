"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";

const medalColor: Record<number, string> = {
  1: "text-amber-300",
  2: "text-zinc-200",
  3: "text-orange-300",
};

export function LeaderboardPreview() {
  const { entries, loading, error } = useLeaderboard(10);

  return (
    <aside className="card p-5">
      <h2 className="text-xl font-semibold tracking-tight">Leaderboard</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Scores are ranked by each user&apos;s average across all validated
        submissions.
      </p>

      {loading && (
        <div className="mt-4 flex items-center gap-3 text-sm text-zinc-400">
          <span className="spinner" />
          Loading leaderboard...
        </div>
      )}

      {!loading && error && (
        <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="mt-4 text-sm text-zinc-400">
          No analyzed submissions yet.
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <ol className="mt-4 flex flex-col gap-2">
          {entries.map((entry, index) => (
            <li
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-sm transition hover:bg-white/[0.04]"
              key={entry.username}
            >
              <span className="flex items-center gap-2.5 text-zinc-300">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold ${
                    medalColor[index + 1] ?? "text-zinc-300"
                  }`}
                >
                  {index + 1}
                </span>
                {entry.username}
              </span>
              <span className="text-right">
                <span className="block font-semibold text-white">
                  {entry.averageScore}
                </span>
                <span className="text-xs text-zinc-500">
                  {entry.submissionCount} submissions
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
