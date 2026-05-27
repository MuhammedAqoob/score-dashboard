"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function AppNav() {
  const { profile, loading, logout } = useAuth();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 text-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-lg font-semibold" href="/">
          Score Board
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link className="text-zinc-300 hover:text-zinc-50" href="/">
            Home
          </Link>
          {profile?.approved && (
            <Link className="text-zinc-300 hover:text-zinc-50" href="/dashboard">
              Dashboard
            </Link>
          )}
          <Link className="text-zinc-300 hover:text-zinc-50" href="/admin">
            Admin
          </Link>

          {loading ? (
            <span className="text-zinc-500">Checking session...</span>
          ) : profile ? (
            <>
              <span className="text-zinc-400">
                {profile.username}
                {!profile.approved ? " (pending)" : ""}
              </span>
              <button
                className="rounded-md bg-zinc-100 px-3 py-1 font-semibold text-zinc-950"
                onClick={logout}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              className="rounded-md bg-emerald-500 px-3 py-1 font-semibold text-zinc-950"
              href="/login"
            >
              Login / Signup
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
