"use client";

import { useMemo } from "react";
import {
  buildScoreTrendData,
  getActiveValidatedSubmissions,
} from "@/services/analyticsService";
import { Submission } from "@/types/submission";

export function useUserAnalytics(submissions: Submission[]) {
  return useMemo(() => {
    const activeValidatedSubmissions = getActiveValidatedSubmissions(submissions);

    return {
      activeValidatedSubmissions,
      trendData: buildScoreTrendData(activeValidatedSubmissions),
      hasAverageAnalytics: activeValidatedSubmissions.length >= 2,
    };
  }, [submissions]);
}
