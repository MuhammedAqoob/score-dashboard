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
          className="card card-hover p-4"
          key={item.key}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">
                {item.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{item.label}</p>
            </div>
            <p
              className="shrink-0 text-2xl font-bold tabular-nums"
              style={{ color: item.color }}
            >
              {item.score}
            </p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ backgroundColor: item.color, width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
