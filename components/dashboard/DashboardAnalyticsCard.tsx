"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SCORE_CATEGORIES } from "@/services/analysisService";
import { ScoreMap } from "@/types/score";
import { formatAxisLabel, tooltipStyle } from "@/utils/chartConstants";

export type AnalyticsSeries = {
  key: "latest" | "highest" | "average";
  label: string;
  score: number;
  date?: string;
  scores?: ScoreMap;
  color: string;
};

type AnalyticsTooltipPayload = {
  color?: string;
  name?: string;
  value?: number | string;
};

function AnalyticsTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: readonly AnalyticsTooltipPayload[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const items = payload.flatMap((item) => {
    const value =
      typeof item.value === "number" ? item.value : Number(item.value);

    if (!Number.isFinite(value)) {
      return [];
    }

    return [
      {
        color: item.color ?? "#d4d4d8",
        name: item.name ?? "Score",
        value,
      },
    ];
  });

  return (
    <div
      className="min-w-48 rounded-xl border border-white/10 bg-zinc-950/95 p-3 text-xs text-zinc-200 shadow-2xl shadow-black/50"
      style={tooltipStyle}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-zinc-500">
        Skill
      </p>
      <p className="mt-1 font-semibold text-white">{label}</p>
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
            <span className="font-semibold text-zinc-100">{item.value}/100</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildUnifiedAnalyticsData(series: AnalyticsSeries[]) {
  return SCORE_CATEGORIES.flatMap((category) => {
    const row: Record<string, number | string> = {
      name: category.label,
    };

    series.forEach((item) => {
      const score = item.scores?.[category.key];

      if (score !== undefined) {
        row[item.key] = score;
      }
    });

    return Object.keys(row).length > 1 ? [row] : [];
  });
}

export function DashboardAnalyticsCard({
  series,
}: {
  series: AnalyticsSeries[];
}) {
  const chartData = useMemo(() => buildUnifiedAnalyticsData(series), [series]);
  const chartHeight = Math.max(430, chartData.length * 64 + 80);

  return (
    <article className="card min-w-0 overflow-hidden p-5 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4 border-b border-white/[0.07] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Today&apos;s Analytics</p>
          <h3 className="mt-2 break-words text-xl font-semibold text-white">
            Score Profile
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Latest submission, best score, and average performance in one
            category view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {series.map((item) => (
            <div
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2"
              key={item.key}
            >
              <p className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </p>
              <p className="mt-1 font-semibold text-white">
                {item.score}
                <span className="text-xs text-zinc-500">/100</span>
              </p>
              {item.date && (
                <p className="mt-0.5 text-[0.68rem] text-zinc-500">
                  {item.date}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div
          className="mt-5 w-full max-w-full min-w-0 overflow-hidden"
          style={{ height: chartHeight }}
        >
          <ResponsiveContainer
            height="100%"
            minHeight={1}
            minWidth={1}
            width="100%"
          >
            <BarChart
              barCategoryGap={16}
              barGap={5}
              data={chartData}
              layout="vertical"
              margin={{ bottom: 8, left: 4, right: 10, top: 8 }}
            >
              <CartesianGrid
                horizontal={false}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <XAxis
                domain={[0, 100]}
                stroke="rgba(255,255,255,0.20)"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                type="number"
              />
              <YAxis
                dataKey="name"
                interval={0}
                stroke="rgba(255,255,255,0.20)"
                tick={{ fill: "#d4d4d8", fontSize: 11 }}
                tickFormatter={formatAxisLabel}
                type="category"
                width={96}
              />
              <Tooltip
                content={(props) => (
                  <AnalyticsTooltip
                    active={props.active}
                    label={String(props.label ?? "")}
                    payload={
                      props.payload as readonly AnalyticsTooltipPayload[]
                    }
                  />
                )}
                cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
              />
              <Legend wrapperStyle={{ color: "#d4d4d8", fontSize: 12 }} />
              {series.map((item) => (
                <Bar
                  animationDuration={700}
                  dataKey={item.key}
                  fill={item.color}
                  key={item.key}
                  name={item.label}
                  radius={[0, 8, 8, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
          Category data is not available yet.
        </p>
      )}
    </article>
  );
}
