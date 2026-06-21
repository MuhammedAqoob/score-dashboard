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

const medalTokens: Record<number, { ring: string; text: string; glow: string }> = {
  1: {
    ring: "ring-amber-400/40",
    text: "text-amber-300",
    glow: "bg-amber-500/10",
  },
  2: {
    ring: "ring-zinc-300/30",
    text: "text-zinc-200",
    glow: "bg-zinc-300/10",
  },
  3: {
    ring: "ring-orange-400/30",
    text: "text-orange-300",
    glow: "bg-orange-500/10",
  },
};

function rankMedal(rank: number) {
  return medalTokens[rank];
}

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const { entries, loading, error } = useLeaderboard(100);
  const [search, setSearch] = useState("");
  const [showAllDesktop, setShowAllDesktop] = useState(false);
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
  const visibleDesktopEntries = showAllDesktop
    ? filteredEntries
    : filteredEntries.slice(0, 10);

  return (
    <main className="min-h-screen overflow-x-hidden px-4 py-8 text-zinc-200 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Top Performers
            </h1>
            <p className="mt-3 max-w-xl text-sm text-zinc-400">
              {entries.length} active player{entries.length === 1 ? "" : "s"} ranked
              by highest validated score. Average score remains visible for
              long-term context.
            </p>
          </div>

          <label className="leaderboard-search flex w-full flex-col gap-2 text-sm font-medium text-zinc-300 lg:max-w-md">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
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
              Search players
            </span>
            <input
              className="input !min-h-12 !rounded-xl !border-white/[0.12] !bg-white/[0.055] !px-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by username"
              value={search}
            />
          </label>
        </header>

        <section className="card leaderboard-shell max-w-full overflow-hidden">
          {loading && (
            <div className="flex items-center gap-3 p-6 text-sm text-zinc-400">
              <span className="spinner" />
              Loading rankings...
            </div>
          )}
          {error && (
            <p className="m-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {!loading && !error && filteredEntries.length === 0 && (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-400">
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="text-sm text-zinc-400">No players found.</p>
            </div>
          )}

          {!loading && !error && filteredEntries.length > 0 && (
            <>
              <div className="grid gap-3 p-3 md:hidden">
                {filteredEntries.map((entry) => {
                  const rank =
                    entries.findIndex(
                      (leaderboardEntry) =>
                        leaderboardEntry.username === entry.username,
                    ) + 1;
                  const medal = rankMedal(rank);

                  return (
                    <article
                      className={`relative overflow-hidden rounded-2xl border border-white/[0.07] p-4 ${
                        medal ? medal.glow : ""
                      }`}
                      key={entry.username}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span
                            className={`inline-flex min-w-9 justify-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm font-bold text-white ring-1 ${
                              medal ? medal.ring : "ring-transparent"
                            }`}
                          >
                            #{rank}
                          </span>
                          <h2 className="mt-3 break-words text-lg font-semibold text-white">
                            {entry.username}
                          </h2>
                        </div>
                        <button
                          className="btn btn-primary shrink-0 !min-h-9 !px-3 !text-xs"
                          disabled={profile?.username === entry.username}
                          onClick={() => setCompareUsername(entry.username)}
                          type="button"
                        >
                          {profile?.username === entry.username
                            ? "You"
                            : "Compare"}
                        </button>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                          <p className="text-xs text-zinc-500">Ranking Score</p>
                          <p className="mt-1 font-bold text-emerald-400">
                            {entry.topScore}/100
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                          <p className="text-xs text-zinc-500">Average</p>
                          <p className="mt-1 font-bold text-zinc-100">
                            {entry.averageScore}/100
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-zinc-500">
                        Date achieved: {formatDate(entry.dateAchieved)}
                      </p>
                    </article>
                  );
                })}
              </div>
              <div className="hidden max-w-full px-3 pb-3 md:block lg:px-4 lg:pb-4">
                <table className="pro-table leaderboard-table w-full table-fixed">
                  <thead>
                    <tr>
                      <th className="w-[12%]">Rank</th>
                      <th className="w-[28%]">Username</th>
                      <th className="w-[17%]">Ranking Score</th>
                      <th className="w-[17%]">Average</th>
                      <th className="w-[16%]">Date</th>
                      <th className="w-[10%] text-right">Compare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDesktopEntries.map((entry) => {
                      const rank =
                        entries.findIndex(
                          (leaderboardEntry) =>
                            leaderboardEntry.username === entry.username,
                        ) + 1;
                      const medal = rankMedal(rank);

                      return (
                        <tr
                          className={medal ? `leaderboard-top-${rank}` : ""}
                          key={entry.username}
                        >
                          <td>
                            <span
                              className={`inline-flex min-w-9 justify-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-bold text-white ring-1 ${
                                medal ? medal.ring : "ring-transparent"
                              }`}
                            >
                              #{rank}
                            </span>
                          </td>
                          <td className="font-semibold text-white">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="truncate">{entry.username}</span>
                              {rank <= 3 && (
                                <span
                                  className={`shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-semibold ${medal.text}`}
                                >
                                  Top {rank}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="font-bold text-emerald-400">
                            {entry.topScore}
                            <span className="font-medium text-zinc-600">
                              /100
                            </span>
                          </td>
                          <td className="text-zinc-300">
                            {entry.averageScore}
                            <span className="text-zinc-600">/100</span>
                            <span className="ml-1.5 text-xs text-zinc-500">
                              from {entry.submissionCount}
                            </span>
                          </td>
                          <td className="text-zinc-400">
                            {formatDate(entry.dateAchieved)}
                          </td>
                          <td className="text-right">
                            <button
                              className="btn btn-primary !min-h-9 !px-3 !text-xs"
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
                {filteredEntries.length > 10 && (
                  <div className="flex justify-center border-t border-white/[0.07] px-4 pb-2 pt-5">
                    <button
                      className="btn btn-ghost"
                      onClick={() => setShowAllDesktop((current) => !current)}
                      type="button"
                    >
                      {showAllDesktop
                        ? "Show Top 10"
                        : `View More (${filteredEntries.length - 10})`}
                    </button>
                  </div>
                )}
              </div>
            </>
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
