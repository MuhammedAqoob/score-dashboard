"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";

export function LeaderboardPreview() {
  const { entries, loading, error } = useLeaderboard(10);

  return (
    <aside className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <h2 className="text-xl font-semibold">Leaderboard</h2>

      {loading && (
        <p className="mt-4 text-sm text-zinc-400">Loading leaderboard...</p>
      )}

      {!loading && error && (
        <p className="mt-4 text-sm text-red-200">{error}</p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="mt-4 text-sm text-zinc-400">
          No analyzed submissions yet.
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <ol className="mt-4 flex flex-col gap-3">
          {entries.map((entry, index) => (
            <li
              className="flex items-center justify-between rounded-md bg-zinc-950 px-3 py-2 text-sm"
              key={entry.username}
            >
              <span className="text-zinc-300">{index + 1}. {entry.username}</span>
              <span className="text-right">
                <span className="block font-semibold">{entry.averageScore}</span>
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
