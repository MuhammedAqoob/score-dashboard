"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
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
  "#34d399",
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
const yAxisTicks = [0, 25, 50, 75, 100];

const tooltipStyle = {
  background: "rgba(9, 9, 11, 0.95)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 10,
  color: "#f4f4f5",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 20px 40px -20px rgba(0,0,0,0.8)",
} as const;

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
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

type LegendOption = {
  key: string;
  label: string;
  color: string;
};

function ClickableLegend({
  items,
  selectedKey,
  onSelect,
}: {
  items: LegendOption[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => {
        const selected = selectedKey === item.key;
        const dimmed = selectedKey !== null && !selected;

        return (
          <button
            className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              selected
                ? "border-white/20 bg-white/[0.08] text-white"
                : "border-white/[0.07] bg-white/[0.02] text-zinc-300 hover:border-white/15 hover:bg-white/[0.05]"
            } ${dimmed ? "opacity-50" : "opacity-100"}`}
            key={item.key}
            onClick={() => onSelect(selected ? null : item.key)}
            type="button"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="break-words text-left">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function getLineOpacity(dataKey: string, selectedKey: string | null) {
  if (!selectedKey) {
    return 1;
  }

  return selectedKey === dataKey ? 1 : 0.22;
}

function getLineWidth(dataKey: string, selectedKey: string | null) {
  if (!selectedKey) {
    return 3;
  }

  return selectedKey === dataKey ? 4 : 2;
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
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const selectionRef = useRef<HTMLElement>(null);
  const legendItems = [
    { key: "currentUser", label: currentUsername, color: "#34d399" },
    { key: "selectedUser", label: selectedUsername, color: "#a1a1aa" },
  ];

  useEffect(() => {
    if (!selectedLine) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!selectionRef.current?.contains(event.target as Node)) {
        setSelectedLine(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedLine]);

  return (
    <section
      className="card min-w-0 overflow-hidden p-5"
      ref={selectionRef}
    >
      <h3 className="font-semibold text-white">{title}</h3>
      {data.length === 0 ? (
        <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          Not enough category data to compare yet.
        </p>
      ) : (
        <>
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
                  vertical={false}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="name"
                  interval={0}
                  stroke="rgba(255,255,255,0.20)"
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
                  stroke="rgba(255,255,255,0.20)"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  ticks={yAxisTicks}
                  type="number"
                  width={36}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                />
                <Line
                  animationDuration={700}
                  dataKey="currentUser"
                  name={currentUsername}
                  stroke="#34d399"
                  strokeOpacity={getLineOpacity("currentUser", selectedLine)}
                  strokeWidth={getLineWidth("currentUser", selectedLine)}
                  dot={{
                    fill: "#34d399",
                    opacity: getLineOpacity("currentUser", selectedLine),
                    r: selectedLine === "currentUser" ? 4 : 3,
                  }}
                  activeDot={{ r: 5, stroke: "#bbf7d0", strokeWidth: 2 }}
                  type="monotone"
                />
                <Line
                  animationDuration={700}
                  dataKey="selectedUser"
                  name={selectedUsername}
                  stroke="#a1a1aa"
                  strokeOpacity={getLineOpacity("selectedUser", selectedLine)}
                  strokeWidth={getLineWidth("selectedUser", selectedLine)}
                  dot={{
                    fill: "#a1a1aa",
                    opacity: getLineOpacity("selectedUser", selectedLine),
                    r: selectedLine === "selectedUser" ? 4 : 3,
                  }}
                  activeDot={{ r: 5, stroke: "#f4f4f5", strokeWidth: 2 }}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ClickableLegend
            items={legendItems}
            onSelect={setSelectedLine}
            selectedKey={selectedLine}
          />
        </>
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
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const selectionRef = useRef<HTMLElement>(null);
  const legendItems = players.map((player, index) => ({
    key: player.key,
    label: player.username,
    color: lineColors[index % lineColors.length],
  }));

  useEffect(() => {
    if (!selectedLine) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!selectionRef.current?.contains(event.target as Node)) {
        setSelectedLine(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedLine]);

  return (
    <section
      className="card min-w-0 overflow-hidden p-5"
      ref={selectionRef}
    >
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
        <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          No players available for total comparison.
        </p>
      ) : (
        <>
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
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  angle={-40}
                  dataKey="name"
                  height={92}
                  interval={0}
                  stroke="rgba(255,255,255,0.20)"
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
                  stroke="rgba(255,255,255,0.20)"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  ticks={yAxisTicks}
                  type="number"
                  width={36}
                />
                <Tooltip contentStyle={tooltipStyle} />
                {players.map((player, index) => (
                  <Line
                    animationDuration={700}
                    dataKey={player.key}
                    dot={false}
                    key={player.key}
                    name={player.username}
                    stroke={lineColors[index % lineColors.length]}
                    strokeOpacity={getLineOpacity(player.key, selectedLine)}
                    strokeWidth={getLineWidth(player.key, selectedLine)}
                    type="monotone"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ClickableLegend
            items={legendItems}
            onSelect={setSelectedLine}
            selectedKey={selectedLine}
          />
        </>
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm animate-fade-in sm:py-10"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c10] shadow-2xl shadow-black/60 animate-scale-in">
        <header className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="eyebrow">Leaderboard comparison</p>
            <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-white">
              {currentUsername
                ? `${currentUsername} vs ${selectedUsername}`
                : "Performance comparison"}
            </h2>
          </div>
          <button
            className="btn btn-ghost shrink-0"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </header>

        <div className="grid min-w-0 gap-5 p-5 sm:p-6">
          {!currentUsername && (
            <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-300">
              Log in to compare your performance with other users.
            </p>
          )}

          {currentUsername && loading && (
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
              <span className="spinner" />
              Loading comparison data...
            </div>
          )}

          {currentUsername && error && (
            <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {currentUsername && !loading && !error && (
            <>
              <div className="inline-flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1 text-sm">
                {[
                  { key: "pairwise", label: "Pairwise" },
                  { key: "total", label: "Total Comparison" },
                ].map((option) => (
                  <button
                    className={`flex-1 rounded-lg px-3 py-2 font-semibold transition ${
                      comparisonMode === option.key
                        ? "bg-white/[0.08] text-white ring-1 ring-white/10"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
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
                <div className="card p-5">
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
                <div className="card p-5">
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
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
                  <span className="spinner" />
                  Loading total comparison...
                </div>
              ) : totalComparisonError ? (
                <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
