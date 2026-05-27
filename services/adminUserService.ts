import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfileWithId } from "@/types/user";

export function subscribeToUsers(
  onUpdate: (users: UserProfileWithId[]) => void,
  onError: (error: Error) => void,
) {
  const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));

  return onSnapshot(
    usersQuery,
    (snapshot) => {
      onUpdate(
        snapshot.docs.map((userDocument) => ({
          id: userDocument.id,
          ...(userDocument.data() as Omit<UserProfileWithId, "id">),
        })),
      );
    },
    onError,
  );
}

export async function setUserApproval(username: string, approved: boolean) {
  await updateDoc(doc(db, "users", username), {
    approved,
  });
}
