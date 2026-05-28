import { Timestamp } from "firebase/firestore";
import { Submission } from "@/types/submission";
import { UserProfile, UserStatus } from "@/types/user";

type UserLike = Partial<UserProfile> | Record<string, unknown>;
type SubmissionLike = Partial<Submission> | Record<string, unknown>;

export function getEffectiveUserStatus(user?: UserLike | null) {
  if (!user) {
    return "pending" satisfies UserStatus;
  }

  const status = user.status as UserStatus | undefined;
  const bannedUntil = user.bannedUntil as Timestamp | null | undefined;

  if (status === "banned" && isBanExpired(bannedUntil)) {
    return "approved" satisfies UserStatus;
  }

  if (status) {
    return status;
  }

  return Boolean(user.approved) ? "approved" : "pending";
}

export function isApprovedUser(user?: UserLike | null) {
  return getEffectiveUserStatus(user) === "approved";
}

export function isBanExpired(bannedUntil?: Timestamp | null) {
  return Boolean(bannedUntil && bannedUntil.toMillis() <= Date.now());
}

export function isUserCurrentlyBanned(user?: UserLike | null) {
  return getEffectiveUserStatus(user) === "banned";
}

export function getSubmissionStatus(submission: SubmissionLike) {
  return (submission.status as "active" | "deleted" | undefined) ?? "active";
}

export function isActiveValidatedSubmission(submission: SubmissionLike) {
  return Boolean(submission.validated) && getSubmissionStatus(submission) === "active";
}

export function getEffectiveSubmissionScore(submission: SubmissionLike) {
  return Number(submission.calculatedScore ?? 0);
}
