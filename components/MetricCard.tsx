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
    <div className="card card-hover flex h-full flex-col justify-between p-5">
      <p className="text-xs font-medium tracking-wide text-zinc-400">{label}</p>
      <p
        className={`mt-3 text-3xl font-bold tracking-tight ${
          positive ? "text-emerald-400" : "text-white"
        }`}
      >
        {value}
      </p>
      {helper && (
        <p className="mt-1.5 truncate text-xs text-zinc-500">{helper}</p>
      )}
    </div>
  );
}
