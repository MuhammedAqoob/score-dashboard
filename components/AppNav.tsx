"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AppNav() {
  const { profile, loading, logout } = useAuth();
  const pathname = usePathname();

  const getLinkClass = (href: string) =>
    `rounded-md px-3 py-2 transition-colors ${
      pathname === href || (href !== "/" && pathname.startsWith(href))
        ? "bg-emerald-500 text-zinc-950"
        : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50"
    }`;

  return (
    <nav className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 text-zinc-50 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-lg font-semibold" href="/">
          Score Board
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link className={getLinkClass("/")} href="/">
            Home
          </Link>
          {profile?.approved && (
            <Link className={getLinkClass("/dashboard")} href="/dashboard">
              Dashboard
            </Link>
          )}
          <Link className={getLinkClass("/admin")} href="/admin">
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
                className="cursor-pointer rounded-md bg-zinc-100 px-3 py-2 font-semibold text-zinc-950 transition-colors hover:bg-zinc-300 active:bg-zinc-400"
                onClick={logout}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              className="rounded-md bg-emerald-500 px-3 py-2 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 active:bg-emerald-600"
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
