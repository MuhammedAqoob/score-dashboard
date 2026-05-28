import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminLog } from "@/types/adminLog";

const ADMIN_LOGS_COLLECTION = "adminLogs";
const DEFAULT_ADMIN_USERNAME = "admin";

export async function createAdminLog(
  log: Omit<AdminLog, "id" | "createdAt" | "adminUsername"> & {
    adminUsername?: string;
  },
) {
  await addDoc(collection(db, ADMIN_LOGS_COLLECTION), {
    ...log,
    adminUsername: log.adminUsername ?? DEFAULT_ADMIN_USERNAME,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToAdminLogs(
  onUpdate: (logs: AdminLog[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    query(
      collection(db, ADMIN_LOGS_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(50),
    ),
    (snapshot) => {
      onUpdate(
        snapshot.docs.map((logDocument) => ({
          id: logDocument.id,
          ...(logDocument.data() as Omit<AdminLog, "id">),
        })),
      );
    },
    onError,
  );
}
