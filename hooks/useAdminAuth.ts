"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getAdminSession,
  getServerAdminSession,
  loginAdmin,
  logoutAdmin,
  subscribeToAdminSession,
} from "@/services/adminSession";

export function useAdminAuth() {
  const isAdmin = useSyncExternalStore(
    subscribeToAdminSession,
    getAdminSession,
    getServerAdminSession,
  );

  const login = useCallback((username: string, password: string) => {
    loginAdmin(username, password);
  }, []);

  const logout = useCallback(() => {
    logoutAdmin();
  }, []);

  return {
    isAdmin,
    loading: false,
    login,
    logout,
  };
}
