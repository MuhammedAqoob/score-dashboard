type StatusBadgeProps = {
  status: "approved" | "pending" | "rejected";
  label?: string;
};

const statusClasses = {
  approved: "border-emerald-900/70 bg-emerald-950/40 text-emerald-200",
  pending: "border-amber-900/70 bg-amber-950/40 text-amber-200",
  rejected: "border-red-900/70 bg-red-950/30 text-red-200",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {label ?? status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}
