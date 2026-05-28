"use client";

import { useEffect, useState } from "react";
import { subscribeToUserSubmissions } from "@/services/submissionHistoryService";
import { Submission } from "@/types/submission";

export function useUserSubmissions(username?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(Boolean(username));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToUserSubmissions(
      username,
      (userSubmissions) => {
        setSubmissions(userSubmissions);
        setError("");
        setLoading(false);
      },
      (submissionError) => {
        setError(submissionError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [username]);

  return {
    submissions,
    loading,
    error,
  };
}
