"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  const { isAdmin, loading, login } = useAdminAuth();
  const { logout: logoutUser } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && isAdmin) {
      router.replace("/admin");
    }
  }, [isAdmin, loading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    try {
      await logoutUser();
      login(username.trim(), password);
      router.replace("/admin");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not log in as admin.",
      );
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-zinc-50">
      <section className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg font-bold text-zinc-100 ring-1 ring-white/5">
            <svg
              aria-hidden="true"
              className="h-6 w-6 text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="eyebrow text-emerald-400">Admin Access</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Secure Sign In
          </h1>
        </div>

        <form
          className="card flex flex-col gap-4 p-5"
          onSubmit={handleSubmit}
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
            Username
            <input
              className="input"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              value={username}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
            Password
            <input
              className="input"
              placeholder="••••••••"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          <button className="btn btn-primary mt-1 w-full" type="submit">
            Login
          </button>

          {message && (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-fade-in">
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
