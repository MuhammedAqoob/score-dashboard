import { ReactNode } from "react";

type ChartPanelProps = {
  title: string;
  children: ReactNode;
};

export function ChartPanel({ title, children }: ChartPanelProps) {
  return (
    <div className="card min-w-0 overflow-hidden p-4 sm:p-5">
      <h3 className="font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
