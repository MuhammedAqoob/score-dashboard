"use client";

import { useEffect, useState } from "react";
import { subscribeToAdminSubmissions } from "@/services/adminSubmissionService";
import { Submission } from "@/types/submission";

export function useAdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAdminSubmissions(
      (nextSubmissions) => {
        setSubmissions(nextSubmissions);
        setError("");
        setLoading(false);
      },
      (submissionsError) => {
        setError(submissionsError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    submissions,
    loading,
    error,
  };
}
