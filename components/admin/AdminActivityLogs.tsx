"use client";

import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { AdminLog } from "@/types/adminLog";
import { formatDate } from "@/utils/formatDate";

type AdminActivityLogsProps = {
  logs: AdminLog[];
  logsLoading: boolean;
  logsError: string;
};

export function AdminActivityLogs({
  logs,
  logsLoading,
  logsError,
}: AdminActivityLogsProps) {
  return (
    <AdminSectionShell
      eyebrow="History"
      title="Activity Logs"
      description="A chronological record of moderation actions."
    >
      {logsLoading && (
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="spinner" />
          Loading logs...
        </div>
      )}
      {logsError && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {logsError}
        </p>
      )}
      {!logsLoading && !logsError && logs.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">No moderation activity yet.</p>
        </div>
      )}
      <div className="max-h-[420px] divide-y divide-white/[0.06] overflow-y-auto rounded-xl border border-white/[0.07] pr-1">
        {logs.map((log) => (
          <div
            className="grid gap-1 px-4 py-3.5 text-sm sm:grid-cols-[180px_1fr_180px]"
            key={log.id}
          >
            <p className="font-semibold capitalize text-zinc-200">
              {log.actionType.replaceAll("_", " ")}
            </p>
            <p className="text-zinc-400">
              <span className="text-white">{log.targetUsername}</span> -{" "}
              {log.details}
            </p>
            <p className="text-zinc-500">
              {formatDate(log.createdAt, { includeTime: true })}
            </p>
          </div>
        ))}
      </div>
    </AdminSectionShell>
  );
}
