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
    <div className="flex h-full flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm shadow-black/20 transition hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/20 sm:p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold sm:text-3xl ${
          positive ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-zinc-500">{helper}</p>}
    </div>
  );
}
