type StatusBadgeProps = {
  status: "approved" | "pending" | "revoked" | "banned" | "deleted" | "active";
  label?: string;
};

const statusStyles = {
  approved: {
    dot: "bg-emerald-400",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  pending: {
    dot: "bg-amber-400",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  revoked: {
    dot: "bg-red-400",
    className: "border-red-500/25 bg-red-500/10 text-red-300",
  },
  banned: {
    dot: "bg-red-500",
    className: "border-red-500/30 bg-red-500/15 text-red-300",
  },
  deleted: {
    dot: "bg-zinc-500",
    className: "border-white/10 bg-white/[0.04] text-zinc-400",
  },
  active: {
    dot: "bg-sky-400",
    className: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  },
} as const;

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label ?? status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}
