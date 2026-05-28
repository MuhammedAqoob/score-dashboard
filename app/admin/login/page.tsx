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
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-50">
      <form
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="text-sm font-medium text-emerald-400">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold">Login</h1>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
          Username
          <input
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
            onChange={(event) => setUsername(event.target.value)}
            value={username}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
          Password
          <input
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>

        <button
          className="rounded-md bg-emerald-500 px-4 py-2 font-semibold text-zinc-950"
          type="submit"
        >
          Login
        </button>

        {message && <p className="text-sm text-red-200">{message}</p>}
      </form>
    </main>
  );
}
