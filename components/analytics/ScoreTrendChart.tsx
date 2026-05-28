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
    <div className="h-[260px] min-w-0 sm:h-[320px]">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ bottom: 8, left: 0, right: 16, top: 12 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="#71717a"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
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
          <Line
            activeDot={{ r: 6, stroke: "#bbf7d0", strokeWidth: 2 }}
            dataKey={dataKey}
            dot={{ fill: "#22c55e", r: 3 }}
            name="Score"
            stroke="#22c55e"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
