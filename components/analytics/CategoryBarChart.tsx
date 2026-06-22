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
import { formatAxisLabel, tooltipStyle } from "@/utils/chartConstants";

type CategoryBarChartProps = {
  data: CategoryChartItem[];
  height?: number;
};

function getChartHeight(categoryCount: number, height?: number) {
  return height ?? Math.max(400, categoryCount * 58 + 56);
}

export function CategoryBarChart({ data, height }: CategoryBarChartProps) {
  if (data.length === 0) {
    return null;
  }

  const chartHeight = getChartHeight(data.length, height);

  return (
    <div
      className="w-full max-w-full min-w-0 overflow-hidden"
      style={{ height: chartHeight }}
    >
      <ResponsiveContainer height="100%" minHeight={1} minWidth={1} width="100%">
        <BarChart
          data={data}
          layout="vertical"
          barCategoryGap={14}
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
