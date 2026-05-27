"use client";

import { useEffect, useState } from "react";
import { subscribeToLeaderboard } from "@/services/leaderboardService";
import { LeaderboardEntry } from "@/types/score";

export function useLeaderboard(limitCount = 10) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(
      limitCount,
      (leaderboardEntries) => {
        setEntries(leaderboardEntries);
        setError("");
        setLoading(false);
      },
      (leaderboardError) => {
        setError(leaderboardError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [limitCount]);

  return {
    entries,
    loading,
    error,
  };
}
