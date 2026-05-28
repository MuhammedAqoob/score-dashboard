"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/hooks/useAuth";

export function AppNav() {
  const { profile, loading, logout } = useAuth();
  const { isAdmin, logout: logoutAdmin } = useAdminAuth();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const activeLinkClass = (href: string) =>
    pathname === href
      ? "bg-zinc-800 text-white"
      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100";

  const initials = useMemo(() => {
    if (isAdmin) {
      return "A";
    }

    return profile?.username?.slice(0, 1).toUpperCase() ?? "U";
  }, [isAdmin, profile?.username]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("click", handleClick);

    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleLogout = async () => {
    if (isAdmin) {
      logoutAdmin();
    }

    if (profile) {
      await logout();
    }

    setOpen(false);
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 px-6 py-3 text-zinc-50 backdrop-blur">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Link
          className="text-lg font-bold tracking-normal text-white transition-colors hover:text-zinc-300"
          href="/"
        >
          Score Board
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 p-1 text-sm md:flex">
          <Link className={`rounded-full px-4 py-2 ${activeLinkClass("/")}`} href="/">
            Home
          </Link>
          <Link
            className={`rounded-full px-4 py-2 ${activeLinkClass("/leaderboard")}`}
            href="/leaderboard"
          >
            Leaderboard
          </Link>
        </div>

        <div className="flex justify-end">
          {loading ? (
            <span className="text-sm text-zinc-500">Checking session...</span>
          ) : profile || isAdmin ? (
            <div className="relative" ref={menuRef}>
              <button
                aria-expanded={open}
                aria-label="Open profile menu"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-bold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 active:scale-95"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen((current) => !current);
                }}
                type="button"
              >
                {initials}
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40">
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <p className="text-sm font-semibold text-white">
                      {isAdmin ? "Admin" : profile?.username}
                    </p>
                    {profile && !profile.approved && (
                      <p className="mt-1 text-xs text-amber-300">Pending approval</p>
                    )}
                  </div>

                  {profile?.approved && (
                    <Link
                      className="block px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-800"
                      href="/dashboard"
                    >
                      My Dashboard
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      className="block px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-800"
                      href="/admin"
                    >
                      Admin Panel
                    </Link>
                  )}

                  <div className="border-t border-zinc-800" />
                  <button
                    className="w-full cursor-pointer px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-red-950/40 hover:text-red-200 active:bg-red-950/60"
                    onClick={handleLogout}
                    type="button"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              className="cursor-pointer rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-300 active:bg-zinc-400"
              href="/login"
            >
              Login / Signup
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto mt-3 flex w-full max-w-6xl gap-2 text-sm md:hidden">
        <Link className={`rounded-full px-4 py-2 ${activeLinkClass("/")}`} href="/">
          Home
        </Link>
        <Link
          className={`rounded-full px-4 py-2 ${activeLinkClass("/leaderboard")}`}
          href="/leaderboard"
        >
          Leaderboard
        </Link>
      </div>
    </nav>
  );
}
