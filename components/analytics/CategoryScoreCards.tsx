"use client";

import { CategoryChartItem } from "@/services/analyticsService";

type CategoryScoreCardsProps = {
  items: CategoryChartItem[];
};

export function CategoryScoreCards({ items }: CategoryScoreCardsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
          key={item.key}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">{item.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: item.color }}>
              {item.score}
            </p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full"
              style={{ backgroundColor: item.color, width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
