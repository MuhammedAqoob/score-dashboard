import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAdminLog } from "@/services/adminLogService";
import {
  getEffectiveUserStatus,
  isBanExpired,
} from "@/services/moderationUtils";
import { UserProfileWithId, UserStatus } from "@/types/user";

export function subscribeToUsers(
  onUpdate: (users: UserProfileWithId[]) => void,
  onError: (error: Error) => void,
) {
  const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));

  return onSnapshot(
    usersQuery,
    (snapshot) => {
      snapshot.docs.forEach((userDocument) => {
        const user = userDocument.data() as UserProfileWithId;

        if (user.status === "banned" && isBanExpired(user.bannedUntil)) {
          updateDoc(userDocument.ref, {
            approved: true,
            status: "approved",
            bannedUntil: null,
            banReason: null,
          }).catch(onError);
        }
      });

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
  const status: UserStatus = approved ? "approved" : "revoked";

  await updateDoc(doc(db, "users", username), {
    approved,
    status,
    ...(approved
      ? {
          bannedUntil: null,
          banReason: null,
        }
      : {}),
  });

  await createAdminLog({
    actionType: approved ? "approve_user" : "revoke_user",
    targetUsername: username,
    details: approved
      ? "User status set to approved."
      : "User access revoked.",
  });
}

export async function setUserStatus(username: string, status: UserStatus) {
  await updateDoc(doc(db, "users", username), {
    approved: status === "approved",
    status,
    ...(status !== "banned"
      ? {
          bannedUntil: null,
          banReason: null,
        }
      : {}),
  });

  await createAdminLog({
    actionType: status === "approved" ? "approve_user" : "revoke_user",
    targetUsername: username,
    details: `User status set to ${status}.`,
  });
}

export async function banUser(
  username: string,
  bannedUntil: Date | null,
  banReason: string,
) {
  await updateDoc(doc(db, "users", username), {
    approved: false,
    status: "banned",
    bannedUntil: bannedUntil ? Timestamp.fromDate(bannedUntil) : null,
    banReason: banReason.trim() || null,
  });

  await createAdminLog({
    actionType: "ban_user",
    targetUsername: username,
    details: bannedUntil
      ? `User banned until ${bannedUntil.toLocaleString()}.`
      : "User banned without an end date.",
  });
}

export async function unbanUser(username: string) {
  await updateDoc(doc(db, "users", username), {
    approved: true,
    status: "approved",
    bannedUntil: null,
    banReason: null,
  });

  await createAdminLog({
    actionType: "unban_user",
    targetUsername: username,
    details: "User manually unbanned and approved.",
  });
}

export function getAdminUserStatus(user: UserProfileWithId) {
  return getEffectiveUserStatus(user);
}
