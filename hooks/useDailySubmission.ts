"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentDayKey } from "@/services/dayKey";
import { getSubmissionForDay } from "@/services/submissionService";

export function useDailySubmission(username?: string) {
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [loading, setLoading] = useState(Boolean(username));

  const reload = useCallback(async () => {
    if (!username) {
      setHasSubmittedToday(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const submission = await getSubmissionForDay(username, getCurrentDayKey());
    setHasSubmittedToday(Boolean(submission));
    setLoading(false);
  }, [username]);

  useEffect(() => {
    let active = true;

    const loadInitialSubmission = async () => {
      await Promise.resolve();

      if (!username) {
        if (active) {
          setHasSubmittedToday(false);
          setLoading(false);
        }
        return;
      }

      const submission = await getSubmissionForDay(username, getCurrentDayKey());

      if (active) {
        setHasSubmittedToday(Boolean(submission));
        setLoading(false);
      }
    };

    loadInitialSubmission();

    return () => {
      active = false;
    };
  }, [username]);

  return {
    hasSubmittedToday,
    loading,
    reload,
  };
}
