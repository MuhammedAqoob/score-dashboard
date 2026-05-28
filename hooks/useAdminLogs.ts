"use client";

import { useEffect, useState } from "react";
import { subscribeToAdminLogs } from "@/services/adminLogService";
import { AdminLog } from "@/types/adminLog";

export function useAdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAdminLogs(
      (nextLogs) => {
        setLogs(nextLogs);
        setError("");
        setLoading(false);
      },
      (logsError) => {
        setError(logsError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    logs,
    loading,
    error,
  };
}
