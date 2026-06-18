"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeToComparisonSubmissions } from "@/services/submissionHistoryService";
import { Submission } from "@/types/submission";

export function useComparisonSubmissions(usernames: string[]) {
  const usernameSignature = usernames
    .filter(Boolean)
    .sort()
    .join("\u001f");
  const stableUsernames = useMemo(
    () =>
      usernameSignature
        ? Array.from(new Set(usernameSignature.split("\u001f")))
        : [],
    [usernameSignature],
  );
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(stableUsernames.length > 0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (stableUsernames.length === 0) {
      const resetTimer = window.setTimeout(() => {
        setSubmissions([]);
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(resetTimer);
    }

    const loadingTimer = window.setTimeout(() => setLoading(true), 0);
    const unsubscribe = subscribeToComparisonSubmissions(
      stableUsernames,
      (nextSubmissions) => {
        setSubmissions(nextSubmissions);
        setError("");
        setLoading(false);
      },
      (comparisonError) => {
        setError(comparisonError.message);
        setLoading(false);
      },
    );

    return () => {
      window.clearTimeout(loadingTimer);
      unsubscribe();
    };
  }, [stableUsernames]);

  return {
    submissions,
    loading,
    error,
  };
}
