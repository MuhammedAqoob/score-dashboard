"use client";

import { useEffect, useState } from "react";
import { subscribeToValidationEvents } from "@/services/validationEventService";
import { ValidationEvent } from "@/types/validationEvent";

export function useValidationEvents() {
  const [events, setEvents] = useState<ValidationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToValidationEvents(
      (nextEvents) => {
        setEvents(nextEvents);
        setError("");
        setLoading(false);
      },
      (eventError) => {
        setError(eventError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    events,
    loading,
    error,
  };
}
