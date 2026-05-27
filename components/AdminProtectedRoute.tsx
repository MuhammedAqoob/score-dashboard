"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/LoadingState";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/admin/login");
    }
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) {
    return <LoadingState message="Checking admin session..." />;
  }

  return children;
}
