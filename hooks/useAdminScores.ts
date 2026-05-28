"use client";

import { useEffect, useState } from "react";
import {
  AdminScoreMap,
  subscribeToAdminScores,
} from "@/services/adminScoreService";

export function useAdminScores() {
  const [scores, setScores] = useState<AdminScoreMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAdminScores(
      (nextScores) => {
        setScores(nextScores);
        setError("");
        setLoading(false);
      },
      (scoreError) => {
        setError(scoreError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    scores,
    loading,
    error,
  };
}
