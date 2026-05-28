"use client";

import { useEffect, useState } from "react";
import { fetchUserAverageScore } from "@/services/leaderboardService";

export function useUserAverageScore(username?: string) {
  const [averageScore, setAverageScore] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(username));

  useEffect(() => {
    let active = true;

    const loadScore = async () => {
      await Promise.resolve();

      if (!username) {
        setAverageScore(0);
        setSubmissionCount(0);
        setLoading(false);
        return;
      }

      try {
        const score = await fetchUserAverageScore(username);

        if (active) {
          setAverageScore(score.averageScore);
          setSubmissionCount(score.submissionCount);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadScore();

    return () => {
      active = false;
    };
  }, [username]);

  return {
    averageScore,
    submissionCount,
    loading,
  };
}
