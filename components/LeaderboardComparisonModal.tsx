"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useComparisonSubmissions } from "@/hooks/useComparisonSubmissions";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import { SCORE_CATEGORIES } from "@/services/analysisService";
import {
  buildCategoryAverages,
  buildCategoryMaxScores,
  buildPeerComparisonData,
  getActiveValidatedSubmissions,
  PeerComparisonItem,
} from "@/services/analyticsService";
import { getEffectiveSubmissionScore } from "@/services/moderationUtils";
import { Submission } from "@/types/submission";

type LeaderboardComparisonModalProps = {
  currentUsername?: string;
  selectedUsername: string | null;
  onClose: () => void;
};

const lineColors = [
  "#22c55e",
  "#38bdf8",
  "#a78bfa",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#f472b6",
  "#84cc16",
  "#e879f9",
  "#f97316",
  "#d4d4d8",
];

function formatAxisLabel(label: string) {
  const labelMap: Record<string, string> = {
    "Problem-solving": "Problem",
    Brainstorming: "Ideas",
    "Research skill": "Research",
    "Learning speed": "Learning",
    "Analytical thinking": "Analytical",
    "Technical/logical thinking": "Tech/logical",
    "Communication clarity": "Comm.",
    "Decision making": "Decision",
    "Self-correction": "Self-correct",
    "Planning/execution": "Planning",
    "Curiosity/initiative": "Curiosity",
    "Persistence/consistency": "Persistence",
    "Prompt quality": "Prompt",
  };

  return labelMap[label] ?? label;
}

function getTopScore(submissions: Submission[]) {
  return getActiveValidatedSubmissions(submissions).reduce(
    (topScore, submission) =>
      Math.max(topScore, getEffectiveSubmissionScore(submission)),
    0,
  );
}

function getAverageScore(submissions: Submission[]) {
  const activeSubmissions = getActiveValidatedSubmissions(submissions);

  if (activeSubmissions.length === 0) {
    return 0;
  }

  const total = activeSubmissions.reduce(
    (sum, submission) => sum + getEffectiveSubmissionScore(submission),
    0,
  );

  return Math.round(total / activeSubmissions.length);
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function PeerComparisonChart({
  title,
  data,
  currentUsername,
  selectedUsername,
}: {
  title: string;
  data: PeerComparisonItem[];
  currentUsername: string;
  selectedUsername: string;
}) {
  const chartHeight = 380;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="font-semibold text-white">{title}</h3>
      {data.length === 0 ? (
        <p className="mt-4 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
          Not enough category data to compare yet.
        </p>
      ) : (
        <div className="mt-4 w-full max-w-full min-w-0 overflow-hidden" style={{ height: chartHeight }}>
          <ResponsiveContainer
            height="100%"
            minHeight={1}
            minWidth={1}
            width="100%"
          >
            <LineChart
              data={data}
              margin={{ bottom: 86, left: 0, right: 12, top: 12 }}
            >
              <CartesianGrid
                stroke="#27272a"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="name"
                interval={0}
                stroke="#71717a"
                tick={{
                  fill: "#d4d4d8",
                  fontSize: 10,
                  textAnchor: "end",
                }}
                tickFormatter={formatAxisLabel}
                angle={-40}
                height={86}
                type="category"
              />
              <YAxis
                domain={[0, 100]}
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                type="number"
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  color: "#f4f4f5",
                }}
                cursor={{ fill: "rgba(63, 63, 70, 0.24)" }}
              />
              <Legend wrapperStyle={{ color: "#d4d4d8", fontSize: 12 }} />
              <Line
                animationDuration={700}
                dataKey="currentUser"
                name={currentUsername}
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: "#22c55e", r: 3 }}
                activeDot={{ r: 5, stroke: "#bbf7d0", strokeWidth: 2 }}
                type="monotone"
              />
              <Line
                animationDuration={700}
                dataKey="selectedUser"
                name={selectedUsername}
                stroke="#a1a1aa"
                strokeWidth={3}
                dot={{ fill: "#a1a1aa", r: 3 }}
                activeDot={{ r: 5, stroke: "#f4f4f5", strokeWidth: 2 }}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

type TotalComparisonPlayer = {
  key: string;
  username: string;
  submissions: Submission[];
};

function buildTotalComparisonData(players: TotalComparisonPlayer[]) {
  return SCORE_CATEGORIES.map((category) => {
    const row: Record<string, string | number> = {
      name: category.label,
    };

    players.forEach((player) => {
      const averages = buildCategoryAverages(player.submissions);
      row[player.key] = averages[category.key] ?? 0;
    });

    return row;
  });
}

function TotalComparisonChart({
  players,
}: {
  players: TotalComparisonPlayer[];
}) {
  const data = useMemo(() => buildTotalComparisonData(players), [players]);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold text-white">Overall Comparison</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Average category profile for the visible leaderboard players.
          </p>
        </div>
        <p className="text-xs text-zinc-500">
          {players.length} player{players.length === 1 ? "" : "s"}
        </p>
      </div>

      {players.length === 0 ? (
        <p className="mt-4 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
          No players available for total comparison.
        </p>
      ) : (
        <div className="mt-4 h-[420px] w-full max-w-full min-w-0 overflow-hidden">
          <ResponsiveContainer
            height="100%"
            minHeight={1}
            minWidth={1}
            width="100%"
          >
            <LineChart
              data={data}
              margin={{ bottom: 92, left: 0, right: 12, top: 12 }}
            >
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                angle={-40}
                dataKey="name"
                height={92}
                interval={0}
                stroke="#71717a"
                tick={{
                  fill: "#d4d4d8",
                  fontSize: 10,
                  textAnchor: "end",
                }}
                tickFormatter={formatAxisLabel}
                type="category"
              />
              <YAxis
                domain={[0, 100]}
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                type="number"
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: 8,
                  color: "#f4f4f5",
                }}
              />
              <Legend
                wrapperStyle={{
                  color: "#d4d4d8",
                  fontSize: 11,
                  lineHeight: "18px",
                }}
              />
              {players.map((player, index) => (
                <Line
                  animationDuration={700}
                  dataKey={player.key}
                  dot={false}
                  key={player.key}
                  name={player.username}
                  stroke={lineColors[index % lineColors.length]}
                  strokeWidth={2}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function LeaderboardComparisonModal({
  currentUsername,
  selectedUsername,
  onClose,
}: LeaderboardComparisonModalProps) {
  const open = Boolean(selectedUsername);
  const [comparisonMode, setComparisonMode] = useState<"pairwise" | "total">(
    "pairwise",
  );
  const { entries: leaderboardEntries } = useLeaderboard(10);
  const {
    submissions: currentSubmissions,
    loading: currentLoading,
    error: currentError,
  } = useUserSubmissions(open && currentUsername ? currentUsername : undefined);
  const {
    submissions: selectedSubmissions,
    loading: selectedLoading,
    error: selectedError,
  } = useUserSubmissions(
    open && currentUsername && selectedUsername ? selectedUsername : undefined,
  );

  const topComparisonData = useMemo(
    () =>
      buildPeerComparisonData(
        buildCategoryMaxScores(currentSubmissions),
        buildCategoryMaxScores(selectedSubmissions),
      ),
    [currentSubmissions, selectedSubmissions],
  );
  const averageComparisonData = useMemo(
    () =>
      buildPeerComparisonData(
        buildCategoryAverages(currentSubmissions),
        buildCategoryAverages(selectedSubmissions),
      ),
    [currentSubmissions, selectedSubmissions],
  );
  const totalComparisonUsernames = useMemo(() => {
    const topUsernames = leaderboardEntries.map((entry) => entry.username);

    if (selectedUsername && !topUsernames.includes(selectedUsername)) {
      return [...topUsernames, selectedUsername];
    }

    return topUsernames;
  }, [leaderboardEntries, selectedUsername]);
  const {
    submissions: totalComparisonSubmissions,
    loading: totalComparisonLoading,
    error: totalComparisonError,
  } = useComparisonSubmissions(
    open && currentUsername ? totalComparisonUsernames : [],
  );
  const totalComparisonPlayers = useMemo<TotalComparisonPlayer[]>(
    () =>
      totalComparisonUsernames.map((username, index) => ({
        key: `player_${index}`,
        username,
        submissions: totalComparisonSubmissions.filter(
          (submission) => submission.username === username,
        ),
      })),
    [totalComparisonSubmissions, totalComparisonUsernames],
  );

  if (!selectedUsername) {
    return null;
  }

  const loading = currentLoading || selectedLoading;
  const error = currentError || selectedError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm sm:py-10"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
        <header className="flex flex-col gap-4 border-b border-zinc-800 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-400">
              Leaderboard comparison
            </p>
            <h2 className="mt-1 break-words text-2xl font-bold text-white">
              {currentUsername
                ? `${currentUsername} vs ${selectedUsername}`
                : "Performance comparison"}
            </h2>
          </div>
          <button
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </header>

        <div className="grid min-w-0 gap-5 p-4 sm:p-5">
          {!currentUsername && (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
              Log in to compare your performance with other users.
            </p>
          )}

          {currentUsername && loading && (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
              Loading comparison data...
            </p>
          )}

          {currentUsername && error && (
            <p className="rounded-xl border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}

          {currentUsername && !loading && !error && (
            <>
              <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1 text-sm">
                {[
                  { key: "pairwise", label: "Pairwise" },
                  { key: "total", label: "Total Comparison" },
                ].map((option) => (
                  <button
                    className={`flex-1 rounded-lg px-3 py-2 font-semibold transition ${
                      comparisonMode === option.key
                        ? "bg-zinc-100 text-zinc-950"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    }`}
                    key={option.key}
                    onClick={() =>
                      setComparisonMode(option.key as "pairwise" | "total")
                    }
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <section className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <h3 className="font-semibold text-white">Current User</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <StatCard
                      label="Your Top Score"
                      value={`${getTopScore(currentSubmissions)}/100`}
                    />
                    <StatCard
                      label="Your Average Score"
                      value={`${getAverageScore(currentSubmissions)}/100`}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <h3 className="font-semibold text-white">
                    Selected Leaderboard User
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <StatCard
                      label="Their Top Score"
                      value={`${getTopScore(selectedSubmissions)}/100`}
                    />
                    <StatCard
                      label="Their Average Score"
                      value={`${getAverageScore(selectedSubmissions)}/100`}
                    />
                  </div>
                </div>
              </section>

              {comparisonMode === "pairwise" ? (
                <>
                  <PeerComparisonChart
                    currentUsername={currentUsername}
                    data={topComparisonData}
                    selectedUsername={selectedUsername}
                    title="Top Score Comparison"
                  />
                  <PeerComparisonChart
                    currentUsername={currentUsername}
                    data={averageComparisonData}
                    selectedUsername={selectedUsername}
                    title="Average Score Comparison"
                  />
                </>
              ) : totalComparisonLoading ? (
                <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                  Loading total comparison...
                </p>
              ) : totalComparisonError ? (
                <p className="rounded-xl border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm text-red-100">
                  {totalComparisonError}
                </p>
              ) : (
                <TotalComparisonChart players={totalComparisonPlayers} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
