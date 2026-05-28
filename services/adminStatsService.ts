import { collection, getDocs, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentDayKey } from "@/services/dayKey";
import {
  getEffectiveSubmissionScore,
  getEffectiveUserStatus,
  isActiveValidatedSubmission,
} from "@/services/moderationUtils";

export type AdminStats = {
  totalUsers: number;
  approvedUsers: number;
  bannedUsers: number;
  pendingUsers: number;
  activeSubmissions: number;
  deletedSubmissions: number;
  averagePlatformScore: number;
  todaysAverageScore: number;
  totalSubmissions: number;
  pendingQueueSize: number;
  globalSubmissionsToday: number;
};

function buildAdminStats(
  users: Array<Record<string, unknown>>,
  submissions: Array<Record<string, unknown>>,
): AdminStats {
  const todayKey = getCurrentDayKey();
  const activeSubmissions = submissions.filter(isActiveValidatedSubmission);
  const activeSubmissionTotal = activeSubmissions.reduce(
    (total, submission) => total + getEffectiveSubmissionScore(submission),
    0,
  );
  const todaySubmissions = activeSubmissions.filter(
    (submission) => submission.dayKey === todayKey,
  );
  const todaySubmissionTotal = todaySubmissions.reduce(
    (total, submission) => total + getEffectiveSubmissionScore(submission),
    0,
  );

  return {
    totalUsers: users.length,
    approvedUsers: users.filter(
      (user) => getEffectiveUserStatus(user) === "approved",
    ).length,
    bannedUsers: users.filter((user) => getEffectiveUserStatus(user) === "banned")
      .length,
    pendingUsers: users.filter(
      (user) => getEffectiveUserStatus(user) === "pending",
    ).length,
    activeSubmissions: submissions.filter(
      (submission) => (submission.status ?? "active") === "active",
    ).length,
    deletedSubmissions: submissions.filter(
      (submission) => submission.status === "deleted",
    ).length,
    averagePlatformScore: activeSubmissions.length
      ? Math.round(activeSubmissionTotal / activeSubmissions.length)
      : 0,
    todaysAverageScore: todaySubmissions.length
      ? Math.round(todaySubmissionTotal / todaySubmissions.length)
      : 0,
    totalSubmissions: submissions.length,
    pendingQueueSize: users.filter(
      (user) => getEffectiveUserStatus(user) === "pending",
    ).length,
    globalSubmissionsToday: todaySubmissions.length,
  };
}

export async function fetchAdminStats() {
  const [usersSnapshot, submissionsSnapshot] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "submissions")),
  ]);
  const users = usersSnapshot.docs.map((userDocument) => userDocument.data());
  const submissions = submissionsSnapshot.docs.map((submissionDocument) =>
    submissionDocument.data(),
  );

  return buildAdminStats(users, submissions);
}

export function subscribeToAdminStats(
  onUpdate: (stats: AdminStats) => void,
  onError: (error: Error) => void,
) {
  let users: Array<Record<string, unknown>> = [];
  let submissions: Array<Record<string, unknown>> = [];
  let hasUsers = false;
  let hasSubmissions = false;

  const emit = () => {
    if (hasUsers && hasSubmissions) {
      onUpdate(buildAdminStats(users, submissions));
    }
  };

  const unsubscribeUsers = onSnapshot(
    query(collection(db, "users")),
    (snapshot) => {
      users = snapshot.docs.map((userDocument) => userDocument.data());
      hasUsers = true;
      emit();
    },
    onError,
  );

  const unsubscribeSubmissions = onSnapshot(
    query(collection(db, "submissions")),
    (snapshot) => {
      submissions = snapshot.docs.map((submissionDocument) =>
        submissionDocument.data(),
      );
      hasSubmissions = true;
      emit();
    },
    onError,
  );

  return () => {
    unsubscribeUsers();
    unsubscribeSubmissions();
  };
}
