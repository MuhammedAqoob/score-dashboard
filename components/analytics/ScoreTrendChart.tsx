"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { tooltipStyle } from "@/utils/chartConstants";

type ScoreTrendChartProps = {
  data: Array<Record<string, string | number>>;
  dataKey?: string;
};

export function ScoreTrendChart({
  data,
  dataKey = "score",
}: ScoreTrendChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="h-[240px] w-full max-w-full min-w-0 overflow-hidden sm:h-[280px]">
      <ResponsiveContainer height="100%" minHeight={1} minWidth={1} width="100%">
        <LineChart data={data} margin={{ bottom: 8, left: 0, right: 8, top: 12 }}>
          <defs>
            <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.20)"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.20)"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            activeDot={{ r: 6, stroke: "#bbf7d0", strokeWidth: 2 }}
            dataKey={dataKey}
            dot={{ fill: "#34d399", r: 3 }}
            name="Score"
            stroke="#34d399"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
