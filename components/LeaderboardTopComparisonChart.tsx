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
import { SCORE_CATEGORIES } from "@/services/analysisService";
import { buildCategoryAverages } from "@/services/analyticsService";
import { LeaderboardEntry } from "@/types/score";
import { Submission } from "@/types/submission";
import { formatAxisLabel, tooltipStyle } from "@/utils/chartConstants";

type LeaderboardTopComparisonChartProps = {
  entries: LeaderboardEntry[];
};

type ComparisonPlayer = {
  key: string;
  username: string;
  submissions: Submission[];
};

type TooltipPayloadItem = {
  color?: string;
  name?: string;
  value?: number | string;
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
];
const yAxisTicks = [0, 25, 50, 75, 100];
function buildTopComparisonData(players: ComparisonPlayer[]) {
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

function getLineOpacity(dataKey: string, selectedKey: string | null) {
  if (!selectedKey) {
    return 0.92;
  }

  return selectedKey === dataKey ? 1 : 0.16;
}

function getLineWidth(dataKey: string, selectedKey: string | null) {
  if (!selectedKey) {
    return 2.5;
  }

  return selectedKey === dataKey ? 4 : 2;
}

function TopComparisonTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: readonly TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const items = payload
    .flatMap((item) => {
      const value =
        typeof item.value === "number" ? item.value : Number(item.value);

      if (!Number.isFinite(value)) {
        return [];
      }

      return [
        {
          color: item.color ?? "#d4d4d8",
          name: item.name ?? "Player",
          value,
        },
      ];
    })
    .sort((first, second) => second.value - first.value);
  const leader = items[0];

  if (!leader) {
    return null;
  }

  return (
    <div
      className="min-w-56 rounded-xl border border-white/10 bg-zinc-950/95 p-3 text-xs text-zinc-200 shadow-2xl shadow-black/50"
      style={tooltipStyle}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-zinc-500">
        Skill
      </p>
      <p className="mt-1 font-semibold text-white">{label}</p>
      <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-emerald-200/80">
          Highest at this point
        </p>
        <p className="mt-1 flex items-center justify-between gap-3 text-sm font-semibold text-white">
          <span className="min-w-0 truncate">{leader.name}</span>
          <span className="text-emerald-300">{leader.value}/100</span>
        </p>
      </div>
      <div className="mt-3 grid max-h-48 gap-1.5 overflow-y-auto pr-1">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-3" key={item.name}>
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-zinc-300">{item.name}</span>
            </span>
            <span className="font-semibold text-zinc-100">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardTopComparisonChart({
  entries,
}: LeaderboardTopComparisonChartProps) {
  const [expanded, setExpanded] = useState(false);
  const topEntries = useMemo(() => entries.slice(0, 10), [entries]);
  const usernames = useMemo(
    () => (expanded ? topEntries.map((entry) => entry.username) : []),
    [expanded, topEntries],
  );
  const { submissions, loading, error } = useComparisonSubmissions(usernames);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const selectionRef = useRef<HTMLElement>(null);
  const players = useMemo<ComparisonPlayer[]>(
    () =>
      topEntries.map((entry, index) => ({
        key: `player_${index}`,
        username: entry.username,
        submissions: submissions.filter(
          (submission) => submission.username === entry.username,
        ),
      })),
    [submissions, topEntries],
  );
  const data = useMemo(() => buildTopComparisonData(players), [players]);

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

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      className="card min-w-0 overflow-hidden border-emerald-400/20 p-5 shadow-[0_28px_70px_-42px_rgba(52,211,153,0.55)] sm:p-6"
      ref={selectionRef}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Compare Top 10</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Top 10 Skill Profile Graph
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Open a focused category comparison for the current leaderboard
            leaders.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
            {topEntries.length} ranked player
            {topEntries.length === 1 ? "" : "s"}
          </div>
          <button
            className="btn btn-primary !min-h-10 !px-4 !text-xs"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? "Hide Graph" : "Show Top 10 Graph"}
          </button>
        </div>
      </div>

      {!expanded && (
        <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          The top 10 comparison graph is ready when you want a deeper view.
        </div>
      )}

      {expanded && loading && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          <span className="spinner" />
          Loading top 10 comparison...
        </div>
      )}

      {expanded && error && (
        <p className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {expanded && !loading && !error && (
        <>
          <div className="mt-5 h-[560px] w-full max-w-full min-w-0 overflow-hidden sm:h-[620px]">
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
                <Tooltip
                  content={(props) => (
                    <TopComparisonTooltip
                      active={props.active}
                      label={String(props.label ?? "")}
                      payload={props.payload as readonly TooltipPayloadItem[]}
                    />
                  )}
                  cursor={{ stroke: "rgba(255,255,255,0.14)" }}
                />
                {players.map((player, index) => (
                  <Line
                    activeDot={{
                      r: 5,
                      stroke: "#fafafa",
                      strokeWidth: 2,
                    }}
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
          <div className="mt-3 flex flex-wrap gap-2">
            {players.map((player, index) => {
              const selected = selectedLine === player.key;
              const dimmed = selectedLine !== null && !selected;

              return (
                <button
                  className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    selected
                      ? "border-white/20 bg-white/[0.08] text-white"
                      : "border-white/[0.07] bg-white/[0.02] text-zinc-300 hover:border-white/15 hover:bg-white/[0.05]"
                  } ${dimmed ? "opacity-50" : "opacity-100"}`}
                  key={player.key}
                  onClick={() => setSelectedLine(selected ? null : player.key)}
                  type="button"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: lineColors[index % lineColors.length],
                    }}
                  />
                  <span className="break-words text-left">
                    {player.username}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
