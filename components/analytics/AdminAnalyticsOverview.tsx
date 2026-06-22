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
import { MetricCard } from "@/components/MetricCard";
import { ChartPanel } from "@/components/analytics/ChartPanel";
import { ScoreTrendChart } from "@/components/analytics/ScoreTrendChart";
import { buildPlatformAnalytics } from "@/services/analyticsService";
import { Submission } from "@/types/submission";
import { ValidationEvent } from "@/types/validationEvent";
import { tooltipStyle } from "@/utils/chartConstants";

type AdminAnalyticsOverviewProps = {
  submissions: Submission[];
  validationEvents?: ValidationEvent[];
};

const ratioColors = ["#34d399", "#ef4444"];

export function AdminAnalyticsOverview({
  submissions,
  validationEvents = [],
}: AdminAnalyticsOverviewProps) {
  const analytics = useMemo(
    () => buildPlatformAnalytics(submissions, validationEvents),
    [submissions, validationEvents],
  );

  return (
    <section className="card min-w-0 overflow-hidden p-5 sm:p-6">
      <div>
        <p className="eyebrow">Analytics</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
          Platform Overview
        </h2>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MetricCard
          helper={analytics.strongestCategory?.label}
          label="Strongest Category"
          value={analytics.strongestCategory?.name ?? "-"}
        />
        <MetricCard
          helper={analytics.weakestCategory?.label}
          label="Weakest Category"
          value={analytics.weakestCategory?.name ?? "-"}
        />
      </div>

      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
        <ChartPanel title="Average score trend">
          {analytics.averageScoreTrend.length > 0 ? (
            <ScoreTrendChart
              data={analytics.averageScoreTrend}
              dataKey="averageScore"
            />
          ) : (
            <p className="text-sm text-zinc-400">No trend data yet.</p>
          )}
        </ChartPanel>

        <ChartPanel title="Validation ratio">
          {analytics.validationRatio.some((item) => item.value > 0) ? (
            <>
              <div className="h-[180px] sm:h-[200px]">
                <ResponsiveContainer
                  height="100%"
                  minHeight={1}
                  minWidth={1}
                  width="100%"
                >
                  <PieChart>
                    <Pie
                      data={analytics.validationRatio}
                      dataKey="value"
                      innerRadius={42}
                      nameKey="name"
                      outerRadius={66}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {analytics.validationRatio.map((entry, index) => (
                        <Cell
                          fill={ratioColors[index % ratioColors.length]}
                          key={entry.name}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
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
            <p className="text-sm text-zinc-400">
              No validation data yet.
            </p>
          )}
        </ChartPanel>
      </div>

      <div className="mt-4">
        <ChartPanel title="Daily submission count">
          {analytics.dailySubmissionCounts.length > 0 ? (
            <div className="h-[220px] sm:h-[240px]">
              <ResponsiveContainer
                height="100%"
                minHeight={1}
                minWidth={1}
                width="100%"
              >
                <BarChart
                  data={analytics.dailySubmissionCounts}
                  margin={{ bottom: 8, left: 0, right: 16, top: 12 }}
                >
                  <defs>
                    <linearGradient id="dailyBarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.20)"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="rgba(255,255,255,0.20)"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                  />
                  <Bar
                    animationDuration={700}
                    dataKey="count"
                    fill="url(#dailyBarFill)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">No daily data yet.</p>
          )}
        </ChartPanel>
      </div>
    </section>
  );
}
