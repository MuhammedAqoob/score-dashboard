"use client";

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
import { CategoryComparisonItem } from "@/services/analyticsService";
import { formatAxisLabel, tooltipStyle } from "@/utils/chartConstants";

type CategoryComparisonChartProps = {
  data: CategoryComparisonItem[];
};

function getChartHeight(categoryCount: number) {
  return Math.max(440, categoryCount * 66 + 72);
}

export function CategoryComparisonChart({ data }: CategoryComparisonChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div
      className="w-full max-w-full min-w-0 overflow-hidden"
      style={{ height: getChartHeight(data.length) }}
    >
      <ResponsiveContainer height="100%" minHeight={1} minWidth={1} width="100%">
        <BarChart
          data={data}
          layout="vertical"
          barCategoryGap={16}
          barGap={6}
          margin={{ bottom: 8, left: 4, right: 8, top: 8 }}
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
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
          />
          <Legend wrapperStyle={{ color: "#d4d4d8", fontSize: 12 }} />
          <Bar
            animationDuration={700}
            dataKey="today"
            fill="#34d399"
            name="Today"
            radius={[0, 8, 8, 0]}
          />
          <Bar
            animationDuration={700}
            dataKey="average"
            fill="#a1a1aa"
            name="Average"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
