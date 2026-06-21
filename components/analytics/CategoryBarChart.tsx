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

const tooltipStyle = {
  background: "rgba(9, 9, 11, 0.95)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 10,
  color: "#f4f4f5",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 20px 40px -20px rgba(0,0,0,0.8)",
} as const;

function getChartHeight(categoryCount: number, height?: number) {
  return height ?? Math.max(400, categoryCount * 58 + 56);
}

function formatAxisLabel(label: string) {
  const labelMap: Record<string, string> = {
    "Problem-solving": "Problem",
    Brainstorming: "Ideas",
    "Research skill": "Research",
    "Learning speed": "Learning",
    "Analytical thinking": "Analytical",
    "Technical/logical thinking": "Tech/logical",
    "Communication clarity": "Comm.",
    "Decision making": "Decision",
    "Self-correction": "Self-correct",
    "Planning/execution": "Planning",
    "Curiosity/initiative": "Curiosity",
    "Persistence/consistency": "Persistence",
    "Prompt quality": "Prompt",
  };

  return labelMap[label] ?? label;
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
