"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CategoryChartItem } from "@/services/analyticsService";

type CategoryBarChartProps = {
  data: CategoryChartItem[];
  height?: number;
};

export function CategoryBarChart({ data, height = 300 }: CategoryBarChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div
      className="h-[300px] w-full max-w-full min-w-0 overflow-hidden"
      style={{ height }}
    >
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ bottom: 8, left: 4, right: 8, top: 8 }}
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
            stroke="#71717a"
            tick={{ fill: "#d4d4d8", fontSize: 11 }}
            type="category"
            width={158}
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
          <Bar animationDuration={700} dataKey="score" radius={[0, 8, 8, 0]}>
            {data.map((entry) => (
              <Cell fill={entry.color} key={entry.key} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
