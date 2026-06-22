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
import { MetricCard } from "@/components/MetricCard";
import { useUserSubmissions } from "@/hooks/useUserSubmissions";
import {
  buildCategoryAverages,
  buildCategoryMaxScores,
  buildPeerComparisonData,
  getActiveValidatedSubmissions,
  PeerComparisonItem,
} from "@/services/analyticsService";
import { getEffectiveSubmissionScore } from "@/services/moderationUtils";
import { Submission } from "@/types/submission";
import { formatAxisLabel, tooltipStyle } from "@/utils/chartConstants";

type LeaderboardComparisonModalProps = {
  currentUsername?: string;
  selectedUsername: string | null;
  onClose: () => void;
};

const yAxisTicks = [0, 25, 50, 75, 100];

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

type LegendOption = {
  key: string;
  label: string;
  color: string;
};

type TooltipPayloadItem = {
  color?: string;
  name?: string;
  value?: number | string;
};

function CategoryScoreTooltip({
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
      className="min-w-48 rounded-xl border border-white/10 bg-zinc-950/95 p-3 text-xs text-zinc-200 shadow-2xl shadow-black/50"
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
      <div className="mt-3 grid gap-1.5">
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
                  content={(props) => (
                    <CategoryScoreTooltip
                      active={props.active}
                      label={String(props.label ?? "")}
                      payload={props.payload as readonly TooltipPayloadItem[]}
                    />
                  )}
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

export function LeaderboardComparisonModal({
  currentUsername,
  selectedUsername,
  onClose,
}: LeaderboardComparisonModalProps) {
  const open = Boolean(selectedUsername);
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
              <section className="grid gap-3 md:grid-cols-2">
                <div className="card p-5">
                  <h3 className="font-semibold text-white">Current User</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <MetricCard
                      label="Your Top Score"
                      value={`${getTopScore(currentSubmissions)}/100`}
                    />
                    <MetricCard
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
                    <MetricCard
                      label="Their Top Score"
                      value={`${getTopScore(selectedSubmissions)}/100`}
                    />
                    <MetricCard
                      label="Their Average Score"
                      value={`${getAverageScore(selectedSubmissions)}/100`}
                    />
                  </div>
                </div>
              </section>

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
          )}
        </div>
      </div>
    </div>
  );
}
