"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/hooks/useAuth";
import { getEffectiveUserStatus } from "@/services/moderationUtils";

export function AppNav() {
  const { profile, loading, logout } = useAuth();
  const { isAdmin, logout: logoutAdmin } = useAdminAuth();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const userStatus = getEffectiveUserStatus(profile);
  const navLinks = useMemo(
    () => [
      { href: "/", label: "Home", match: ["/"] },
      { href: "/leaderboard", label: "Leaderboard", match: ["/leaderboard"] },
      {
        href: isAdmin ? "/admin" : "/dashboard",
        label: "Dashboard",
        match: ["/dashboard", "/admin"],
      },
    ],
    [isAdmin],
  );

  const activeNavIndex = Math.max(
    navLinks.findIndex((link) => link.match.includes(pathname)),
    0,
  );

  const navIndicatorStyle = {
    transform: `translateX(${activeNavIndex * 100}%)`,
  };

  const activeLinkClass = (isActive: boolean) =>
    isActive
      ? "text-white"
      : "text-zinc-400 hover:text-zinc-100";

  const initials = useMemo(() => {
    if (isAdmin) {
      return "A";
    }

    return profile?.username?.slice(0, 1).toUpperCase() ?? "U";
  }, [isAdmin, profile?.username]);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => {
      setProfileOpen(false);
      setSheetOpen(false);
    }, 0);

    return () => window.clearTimeout(closeTimer);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
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

    setProfileOpen(false);
    setSheetOpen(false);
  };

  return (
    <nav className="sticky top-0 z-30 w-full overflow-visible border-b border-white/10 bg-zinc-950/90 px-4 py-3 text-zinc-50 backdrop-blur-xl sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Link
          className="text-base font-semibold tracking-normal text-white transition-colors hover:text-zinc-300 sm:text-lg"
          href="/"
        >
          Score Board
        </Link>

        <div className="relative hidden w-[440px] grid-cols-3 rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm shadow-sm shadow-black/20 md:grid lg:w-[520px]">
          <span
            aria-hidden="true"
            className="absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc((100%-0.5rem)/3)] rounded-full bg-zinc-800/90 shadow-sm shadow-black/30 ring-1 ring-white/10 transition-transform duration-300 ease-out"
            style={navIndicatorStyle}
          />
          {navLinks.map((link, index) => (
            <Link
              className={`relative z-10 rounded-full px-5 py-2.5 text-center transition-colors duration-200 ${activeLinkClass(index === activeNavIndex)}`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden justify-end md:flex">
          {loading ? (
            <span className="text-sm text-zinc-500">Checking session...</span>
          ) : profile || isAdmin ? (
            <div className="relative" ref={menuRef}>
              <button
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-bold text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.07] active:scale-95"
                onClick={(event) => {
                  event.stopPropagation();
                  setProfileOpen((current) => !current);
                }}
                type="button"
              >
                {initials}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-xl shadow-black/40">
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <p className="text-sm font-semibold text-white">
                      {isAdmin ? "Admin" : profile?.username}
                    </p>
                    {profile && userStatus !== "approved" && (
                      <p className="mt-1 text-xs text-amber-300">
                        {userStatus[0].toUpperCase() + userStatus.slice(1)}
                      </p>
                    )}
                  </div>

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

        <button
          aria-expanded={sheetOpen}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.07] active:scale-95 md:hidden"
          onClick={() => setSheetOpen(true)}
          type="button"
        >
          <span className="flex w-4 flex-col gap-1">
            <span className="h-0.5 rounded-full bg-zinc-100" />
            <span className="h-0.5 rounded-full bg-zinc-100" />
            <span className="h-0.5 rounded-full bg-zinc-100" />
          </span>
        </button>
      </div>

      {sheetOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[100] isolate bg-black md:hidden"
          role="dialog"
        >
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 h-full w-full cursor-default bg-black"
            onClick={() => setSheetOpen(false)}
            type="button"
          />
          <div className="absolute right-0 top-0 z-[101] flex h-full w-[min(22rem,calc(100vw-2rem))] flex-col border-l border-white/15 bg-black p-5 shadow-2xl shadow-black ring-1 ring-white/10 transition-transform duration-300 ease-out">
            <div className="flex items-center justify-between gap-4">
              <Link
                className="text-base font-semibold text-white"
                href="/"
                onClick={() => setSheetOpen(false)}
              >
                Score Board
              </Link>
              <button
                aria-label="Close navigation menu"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 text-xl leading-none text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                onClick={() => setSheetOpen(false)}
                type="button"
              >
                x
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              {navLinks.map((link, index) => (
                <Link
                  className={`rounded-xl px-4 py-3 text-base font-medium transition ${
                    index === activeNavIndex
                      ? "bg-white/[0.06] text-white ring-1 ring-white/10"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                  }`}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto border-t border-white/10 pt-5">
              {loading ? (
                <p className="text-sm text-zinc-500">Checking session...</p>
              ) : profile || isAdmin ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-bold text-zinc-100">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {isAdmin ? "Admin" : profile?.username}
                      </p>
                      {profile && userStatus !== "approved" && (
                        <p className="mt-0.5 text-xs text-amber-300">
                          {userStatus[0].toUpperCase() + userStatus.slice(1)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    className="cursor-pointer rounded-full border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-red-950/40 hover:text-red-200"
                    onClick={handleLogout}
                    type="button"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  className="inline-flex w-full cursor-pointer justify-center rounded-full bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-300 active:bg-zinc-400"
                  href="/login"
                  onClick={() => setSheetOpen(false)}
                >
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
