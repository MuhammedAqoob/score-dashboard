"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { firebaseUser, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !firebaseUser) {
      return;
    }

    router.replace(profile ? "/dashboard" : "/login");
  }, [firebaseUser, loading, profile, router]);

  return <LoadingState message="Starting anonymous session..." />;
}
