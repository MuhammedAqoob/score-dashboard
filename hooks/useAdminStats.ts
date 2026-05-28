"use client";

import { useEffect, useState } from "react";
import { fetchAdminStats } from "@/services/adminStatsService";

type AdminStats = {
  totalUsers: number;
  totalSubmissions: number;
  pendingQueueSize: number;
  globalSubmissionsToday: number;
};

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        const adminStats = await fetchAdminStats();

        if (active) {
          setStats(adminStats);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load admin stats.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  return {
    stats,
    loading,
    error,
  };
}
