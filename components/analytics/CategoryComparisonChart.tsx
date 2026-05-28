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

export function CategoryComparisonChart({ data }: CategoryComparisonChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="h-[340px] min-w-0 sm:h-[380px]">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ bottom: 8, left: 8, right: 16, top: 8 }}
        >
          <CartesianGrid horizontal={false} stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            domain={[0, 100]}
            stroke="#71717a"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            type="number"
          />
          <YAxis
            dataKey="name"
            stroke="#71717a"
            tick={{ fill: "#d4d4d8", fontSize: 12 }}
            type="category"
            width={120}
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
