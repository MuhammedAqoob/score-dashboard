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
  const [open, setOpen] = useState(false);
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
    const closeTimer = window.setTimeout(() => setOpen(false), 0);

    return () => window.clearTimeout(closeTimer);
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
    <nav className="sticky top-0 z-30 overflow-visible border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 text-zinc-50 backdrop-blur sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Link
          className="text-lg font-bold tracking-normal text-white transition-colors hover:text-zinc-300"
          href="/"
        >
          Score Board
        </Link>

        <div className="relative hidden w-[360px] grid-cols-3 rounded-full border border-zinc-800 bg-zinc-900/70 p-1 text-sm shadow-sm shadow-black/20 md:grid">
          <span
            aria-hidden="true"
            className="absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc((100%-0.5rem)/3)] rounded-full bg-zinc-800 shadow-sm shadow-black/30 ring-1 ring-zinc-700/70 transition-transform duration-300 ease-out"
            style={navIndicatorStyle}
          />
          {navLinks.map((link, index) => (
            <Link
              className={`relative z-10 rounded-full px-4 py-2 text-center transition-colors duration-200 ${activeLinkClass(index === activeNavIndex)}`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
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
                <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40">
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
      </div>

      <div className="relative mx-auto mt-3 grid w-full max-w-md grid-cols-3 rounded-full border border-zinc-800 bg-zinc-900/60 p-1 text-sm md:hidden">
        <span
          aria-hidden="true"
          className="absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc((100%-0.5rem)/3)] rounded-full bg-zinc-800 shadow-sm shadow-black/30 ring-1 ring-zinc-700/70 transition-transform duration-300 ease-out"
          style={navIndicatorStyle}
        />
        {navLinks.map((link, index) => (
          <Link
            className={`relative z-10 min-w-0 rounded-full px-2 py-2 text-center text-xs transition-colors duration-200 min-[380px]:text-sm ${activeLinkClass(index === activeNavIndex)}`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
