"use client";

import { useEffect, useState } from "react";
import { subscribeToUsers } from "@/services/adminUserService";
import { UserProfileWithId } from "@/types/user";

export function useAdminUsers() {
  const [users, setUsers] = useState<UserProfileWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToUsers(
      (nextUsers) => {
        setUsers(nextUsers);
        setError("");
        setLoading(false);
      },
      (usersError) => {
        setError(usersError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    users,
    loading,
    error,
  };
}
