import { Timestamp } from "firebase/firestore";

type FormatDateOptions = {
  fallback?: string;
  includeTime?: boolean;
};

export function formatDate(
  timestamp?: Timestamp,
  options: FormatDateOptions = {},
) {
  if (!timestamp) {
    return options.fallback ?? "-";
  }

  if (options.includeTime) {
    return timestamp.toDate().toLocaleString();
  }

  return timestamp.toDate().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
