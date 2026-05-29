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

type CategoryComparisonChartProps = {
  data: CategoryComparisonItem[];
};

function getChartHeight(categoryCount: number) {
  return Math.max(420, categoryCount * 64 + 64);
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
          margin={{ bottom: 8, left: 24, right: 8, top: 8 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke="#27272a"
            strokeDasharray="3 3"
          />
          <XAxis
            domain={[0, 100]}
            stroke="#71717a"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            type="number"
          />
          <YAxis
            dataKey="name"
            interval={0}
            stroke="#71717a"
            tick={{ fill: "#d4d4d8", fontSize: 11 }}
            type="category"
            width={190}
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
          <Bar
            animationDuration={700}
            dataKey="today"
            fill="#22c55e"
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
