"use client";

import { useCallback, useState } from "react";
import {
  getAdminSession,
  loginAdmin,
  logoutAdmin,
} from "@/services/adminSession";

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(() => getAdminSession());

  const login = useCallback((username: string, password: string) => {
    loginAdmin(username, password);
    setIsAdmin(true);
  }, []);

  const logout = useCallback(() => {
    logoutAdmin();
    setIsAdmin(false);
  }, []);

  return {
    isAdmin,
    loading: false,
    login,
    logout,
  };
}
