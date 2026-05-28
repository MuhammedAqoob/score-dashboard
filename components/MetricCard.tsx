type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  positive?: boolean;
};

export function MetricCard({
  label,
  value,
  helper,
  positive = false,
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-sm shadow-black/20">
      <p className="text-sm text-zinc-400">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold ${
          positive ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-zinc-500">{helper}</p>}
    </div>
  );
}
