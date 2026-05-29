"use client";

import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { LeaderboardComparisonModal } from "@/components/LeaderboardComparisonModal";
import { useAuth } from "@/hooks/useAuth";
import { useLeaderboard } from "@/hooks/useLeaderboard";

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) {
    return "-";
  }

  return timestamp.toDate().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRankClass(rank: number) {
  if (rank === 1) {
    return "border-amber-500/40 bg-amber-950/20";
  }

  if (rank === 2) {
    return "border-zinc-500/40 bg-zinc-800/60";
  }

  if (rank === 3) {
    return "border-orange-500/30 bg-orange-950/20";
  }

  return "border-zinc-800";
}

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const { entries, loading, error } = useLeaderboard(100);
  const [search, setSearch] = useState("");
  const [compareUsername, setCompareUsername] = useState<string | null>(null);
  const filteredEntries = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return entries;
    }

    return entries.filter((entry) =>
      entry.username.toLowerCase().includes(searchValue),
    );
  }, [entries, search]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 px-4 py-6 text-zinc-200 sm:px-6 sm:py-8">
      <section className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Leaderboard
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Top Performers
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              {entries.length} active players ranked by average validated score.
            </p>
          </div>

          <label className="flex w-full max-w-sm flex-col gap-2 text-sm font-medium text-zinc-300">
            Search players
            <input
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none transition focus:border-emerald-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by username"
              value={search}
            />
          </label>
        </header>

        <section className="max-w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm shadow-black/20">
          {loading && <p className="p-5 text-sm text-zinc-400">Loading rankings...</p>}
          {error && <p className="p-5 text-sm text-red-200">{error}</p>}

          {!loading && !error && filteredEntries.length === 0 && (
            <p className="p-5 text-sm text-zinc-400">No players found.</p>
          )}

          {!loading && !error && filteredEntries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="sticky top-0 bg-zinc-950 text-zinc-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Rank</th>
                    <th className="px-5 py-4 font-medium">Username</th>
                    <th className="px-5 py-4 font-medium">Top Score</th>
                    <th className="px-5 py-4 font-medium">Average</th>
                    <th className="px-5 py-4 font-medium">Date Achieved</th>
                    <th className="px-5 py-4 font-medium">Compare</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => {
                    const rank =
                      entries.findIndex(
                        (leaderboardEntry) =>
                          leaderboardEntry.username === entry.username,
                      ) + 1;

                    return (
                      <tr
                        className={`border-t ${getRankClass(rank)}`}
                        key={entry.username}
                      >
                        <td className="px-5 py-4">
                          <span className="inline-flex min-w-9 justify-center rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 font-bold text-white">
                            #{rank}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-white">
                          {entry.username}
                          {rank <= 3 && (
                            <span className="ml-2 rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-xs text-zinc-300">
                              Top {rank}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-400">
                          {entry.topScore}/100
                        </td>
                        <td className="px-5 py-4 text-zinc-300">
                          {entry.averageScore}/100 from {entry.submissionCount}
                        </td>
                        <td className="px-5 py-4 text-zinc-400">
                          {formatDate(entry.dateAchieved)}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={profile?.username === entry.username}
                            onClick={() => setCompareUsername(entry.username)}
                            type="button"
                          >
                            {profile?.username === entry.username
                              ? "You"
                              : "Compare"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
      <LeaderboardComparisonModal
        currentUsername={profile?.username}
        onClose={() => setCompareUsername(null)}
        selectedUsername={compareUsername}
      />
    </main>
  );
}
