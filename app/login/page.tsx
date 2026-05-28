"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { firebaseUser, profile, loading, error, login, signup } = useAuth();
  const router = useRouter();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      router.replace("/");
    }
  }, [loading, profile, router]);

  const cleanUsername = username.trim().toLowerCase();

  const handleUsernameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      passwordInputRef.current?.focus();
    }
  };

  const handleModeChange = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setUsername("");
    setPassword("");
    setMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!cleanUsername || !password) {
      setMessage("Enter username and password.");
      return;
    }

    try {
      setSubmitting(true);

      if (mode === "signup") {
        await signup(cleanUsername, password);
        setMessage("Profile created. Wait for admin approval before logging in.");
        return;
      } else {
        await login(cleanUsername, password);
      }

      router.replace("/");
    } catch (submitError) {
      setMessage(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !firebaseUser) {
    return <LoadingState message="Preparing anonymous session..." />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-50">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Anonymous Firebase UID ready
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Score Board</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Log in with your app username and password.
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-emerald-500 text-zinc-950"
                : "text-zinc-300 hover:bg-zinc-800"
            }`}
            type="button"
            onClick={() => handleModeChange("login")}
          >
            Login
          </button>
          <button
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-emerald-500 text-zinc-950"
                : "text-zinc-300 hover:bg-zinc-800"
            }`}
            type="button"
            onClick={() => handleModeChange("signup")}
          >
            Signup
          </button>
        </div>

        <form
          className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5"
          onSubmit={handleSubmit}
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
            Username
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
              onChange={(event) => setUsername(event.target.value)}
              onKeyDown={handleUsernameKeyDown}
              value={username}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
            Password
            <input
              ref={passwordInputRef}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-emerald-400"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          <button
            className="cursor-pointer rounded-md bg-emerald-500 px-4 py-2 font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 active:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting
              ? "Please wait..."
              : mode === "signup"
                ? "Create profile"
                : "Login"}
          </button>
        </form>

        {(message || error) && (
          <p className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">
            {message || error}
          </p>
        )}
      </section>
    </main>
  );
}
