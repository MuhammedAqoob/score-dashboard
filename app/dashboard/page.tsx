"use client";

import { FormEvent, useState } from "react";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) {
    return "Just now";
  }

  return timestamp.toDate().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DashboardContent() {
  const { firebaseUser, profile, logout, updateProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUsernameSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!firebaseUser) {
      setMessage("Anonymous session is not ready.");
      return;
    }

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setMessage("Username cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      await updateProfile({ username: cleanUsername });
      setMessage("Username saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save username.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Anonymous Session
            </p>
            <h1 className="mt-1 text-3xl font-semibold">
              Welcome, {profile?.username}
            </h1>
          </div>

          <button
            className="w-full rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 sm:w-auto"
            onClick={logout}
            type="button"
          >
            Logout
          </button>
        </header>

        <Link
          className="rounded-lg border border-emerald-900/70 bg-emerald-950/30 p-5 transition-colors hover:border-emerald-500"
          href="/prompts"
        >
          <p className="text-sm font-medium text-emerald-400">Daily Prompt</p>
          <p className="mt-2 text-lg font-semibold">Open current prompt</p>
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Username</p>
            <p className="mt-2 text-xl font-semibold">
              {profile?.username ?? "Unknown"}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Score</p>
            <p className="mt-2 text-xl font-semibold">{profile?.score ?? 0}</p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Approved</p>
            <p className="mt-2 text-xl font-semibold">
              {profile?.approved ? "Yes" : "No"}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Created</p>
            <p className="mt-2 text-xl font-semibold">
              {formatDate(profile?.createdAt)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="font-semibold">Profile Settings</h2>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={handleUsernameSave}
          >
            <input
              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
            <button
              className="rounded-md bg-emerald-500 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>

          {message && <p className="mt-3 text-sm text-zinc-300">{message}</p>}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="font-semibold">Firebase Auth</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[120px_1fr]">
            <dt className="text-zinc-400">UID</dt>
            <dd className="break-all">{firebaseUser?.uid}</dd>
            <dt className="text-zinc-400">Anonymous</dt>
            <dd>{firebaseUser?.isAnonymous ? "Yes" : "No"}</dd>
          </dl>
        </div>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
