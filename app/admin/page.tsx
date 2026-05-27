"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { LeaderboardPreview } from "@/components/LeaderboardPreview";
import { useActivePrompt } from "@/hooks/useActivePrompt";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminStats } from "@/hooks/useAdminStats";
import { saveActivePrompt } from "@/services/promptService";

function AdminDashboardContent() {
  const { logout } = useAdminAuth();
  const router = useRouter();
  const { prompt, loading: promptLoading, reload } = useActivePrompt();
  const { stats, loading: statsLoading, error: statsError } = useAdminStats();
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const titleValue = title ?? prompt?.title ?? "";
  const contentValue = content ?? prompt?.content ?? "";
  const versionValue = version ?? prompt?.version ?? 1;

  const handleSavePrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    try {
      setSaving(true);
      await saveActivePrompt({
        title: titleValue,
        content: contentValue,
        version: versionValue,
      });
      await reload();
      setMessage("Active prompt saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save prompt.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">Admin</p>
            <h1 className="mt-1 text-3xl font-semibold">Dashboard</h1>
          </div>

          <div className="flex gap-3">
            <Link
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100"
              href="/"
            >
              Homepage
            </Link>
            <button
              className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Total Users</p>
            <p className="mt-2 text-3xl font-semibold">
              {statsLoading ? "..." : stats?.totalUsers ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Total Submissions</p>
            <p className="mt-2 text-3xl font-semibold">
              {statsLoading ? "..." : stats?.totalSubmissions ?? 0}
            </p>
          </div>
        </div>

        {statsError && <p className="text-sm text-red-200">{statsError}</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
            onSubmit={handleSavePrompt}
          >
            <h2 className="text-xl font-semibold">Official Prompt</h2>
            {promptLoading && (
              <p className="mt-3 text-sm text-zinc-400">Loading prompt...</p>
            )}

            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-zinc-200">
              Title
              <input
                className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
                onChange={(event) => setTitle(event.target.value)}
                value={titleValue}
              />
            </label>

            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-zinc-200">
              Version
              <input
                className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
                min={1}
                onChange={(event) => setVersion(Number(event.target.value))}
                type="number"
                value={versionValue}
              />
            </label>

            <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-zinc-200">
              Content
              <textarea
                className="min-h-80 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm leading-6 text-zinc-50 outline-none focus:border-emerald-400"
                onChange={(event) => setContent(event.target.value)}
                value={contentValue}
              />
            </label>

            <button
              className="mt-4 rounded-md bg-emerald-500 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : "Save Active Prompt"}
            </button>

            {message && <p className="mt-3 text-sm text-zinc-300">{message}</p>}
          </form>

          <LeaderboardPreview />
        </div>
      </section>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardContent />
    </AdminProtectedRoute>
  );
}
