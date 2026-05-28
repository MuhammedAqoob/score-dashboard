import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentDayKey } from "@/services/dayKey";

export async function fetchAdminStats() {
  const [usersSnapshot, submissionsSnapshot] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "submissions")),
  ]);
  const todayKey = getCurrentDayKey();

  return {
    totalUsers: usersSnapshot.size,
    totalSubmissions: submissionsSnapshot.size,
    pendingQueueSize: usersSnapshot.docs.filter(
      (userDocument) => !Boolean(userDocument.data().approved),
    ).length,
    globalSubmissionsToday: submissionsSnapshot.docs.filter(
      (submissionDocument) => submissionDocument.data().dayKey === todayKey,
    ).length,
  };
}
