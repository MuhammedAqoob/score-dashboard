import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function fetchAdminStats() {
  const [usersSnapshot, submissionsSnapshot] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "submissions")),
  ]);

  return {
    totalUsers: usersSnapshot.size,
    totalSubmissions: submissionsSnapshot.size,
  };
}
