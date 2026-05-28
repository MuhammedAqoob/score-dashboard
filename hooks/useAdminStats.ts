"use client";

import { useEffect, useState } from "react";
import {
  AdminStats,
  subscribeToAdminStats,
} from "@/services/adminStatsService";

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAdminStats(
      (adminStats) => {
        setStats(adminStats);
        setError("");
        setLoading(false);
      },
      (statsError) => {
        setError(statsError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    stats,
    loading,
    error,
  };
}
