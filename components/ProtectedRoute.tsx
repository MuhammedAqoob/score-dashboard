"use client";

import { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { firebaseUser, profile, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && firebaseUser && (!profile || !profile.approved)) {
      router.replace("/login");
    }
  }, [firebaseUser, loading, profile, router]);

  if (loading) {
    return <LoadingState message="Preparing your anonymous session..." />;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-50">
        <p className="max-w-md rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200">
          {error}
        </p>
      </main>
    );
  }

  if (!firebaseUser || !profile || !profile.approved) {
    return <LoadingState message="Redirecting to login..." />;
  }

  return children;
}
