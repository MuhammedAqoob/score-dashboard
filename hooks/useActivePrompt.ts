"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchActivePrompt } from "@/services/promptService";
import { PromptWithId } from "@/types/prompt";

export function useActivePrompt() {
  const [prompt, setPrompt] = useState<PromptWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const activePrompt = await fetchActivePrompt();
      setPrompt(activePrompt);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load active prompt.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadInitialPrompt = async () => {
      try {
        const activePrompt = await fetchActivePrompt();

        if (active) {
          setPrompt(activePrompt);
          setError("");
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load active prompt.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialPrompt();

    return () => {
      active = false;
    };
  }, []);

  return {
    prompt,
    loading,
    error,
    reload,
  };
}
