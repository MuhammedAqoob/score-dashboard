"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ScoreTrendChart } from "@/components/analytics/ScoreTrendChart";
import { buildPlatformAnalytics } from "@/services/analyticsService";
import { Submission } from "@/types/submission";

type AdminAnalyticsOverviewProps = {
  submissions: Submission[];
};

const ratioColors = ["#22c55e", "#ef4444"];

function InsightCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {helper && <p className="mt-1 text-xs text-zinc-500">{helper}</p>}
    </div>
  );
}

export function AdminAnalyticsOverview({
  submissions,
}: AdminAnalyticsOverviewProps) {
  const analytics = useMemo(
    () => buildPlatformAnalytics(submissions),
    [submissions],
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
      <div>
        <p className="text-sm font-medium text-emerald-400">Analytics</p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          Platform Overview
        </h2>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InsightCard
          helper={analytics.strongestCategory?.label}
          label="Strongest Category"
          value={analytics.strongestCategory?.name ?? "-"}
        />
        <InsightCard
          helper={analytics.weakestCategory?.label}
          label="Weakest Category"
          value={analytics.weakestCategory?.name ?? "-"}
        />
      </div>

      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
          <h3 className="font-semibold text-white">Average score trend</h3>
          {analytics.averageScoreTrend.length > 0 ? (
            <ScoreTrendChart
              data={analytics.averageScoreTrend}
              dataKey="averageScore"
            />
          ) : (
            <p className="mt-3 text-sm text-zinc-400">No trend data yet.</p>
          )}
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
          <h3 className="font-semibold text-white">Validation ratio</h3>
          {analytics.validationRatio.some((item) => item.value > 0) ? (
            <>
              <div className="h-[180px] sm:h-[200px]">
                <ResponsiveContainer height="100%" width="100%">
                  <PieChart>
                    <Pie
                      data={analytics.validationRatio}
                      dataKey="value"
                      innerRadius={42}
                      nameKey="name"
                      outerRadius={66}
                      paddingAngle={2}
                    >
                      {analytics.validationRatio.map((entry, index) => (
                        <Cell
                          fill={ratioColors[index % ratioColors.length]}
                          key={entry.name}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#09090b",
                        border: "1px solid #27272a",
                        borderRadius: 8,
                        color: "#f4f4f5",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                {analytics.validationRatio.map((item, index) => (
                  <span className="inline-flex items-center gap-2" key={item.name}>
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: ratioColors[index % ratioColors.length],
                      }}
                    />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">
              No validation data yet.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
        <h3 className="font-semibold text-white">Daily submission count</h3>
        {analytics.dailySubmissionCounts.length > 0 ? (
          <div className="h-[220px] sm:h-[240px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={analytics.dailySubmissionCounts}
                margin={{ bottom: 8, left: 0, right: 16, top: 12 }}
              >
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#71717a"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: 8,
                    color: "#f4f4f5",
                  }}
                />
                <Bar
                  animationDuration={700}
                  dataKey="count"
                  fill="#22c55e"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-400">No daily data yet.</p>
        )}
      </div>
    </section>
  );
}
