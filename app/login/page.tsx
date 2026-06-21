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
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-zinc-50">
      <section className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-emerald-950 shadow-lg shadow-emerald-500/25">
            S
          </div>
          <p className="eyebrow text-emerald-400">Anonymous Firebase UID ready</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Log in with your app username and password to continue.
          </p>
        </div>

        <div className="card p-5">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
            <button
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
              type="button"
              onClick={() => handleModeChange("login")}
            >
              Login
            </button>
            <button
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-white/10"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
              type="button"
              onClick={() => handleModeChange("signup")}
            >
              Signup
            </button>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
              Username
              <input
                className="input"
                onChange={(event) => setUsername(event.target.value)}
                onKeyDown={handleUsernameKeyDown}
                placeholder="your-username"
                value={username}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
              Password
              <input
                className="input"
                placeholder="••••••••"
                ref={passwordInputRef}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>

            <button
              className="btn btn-primary mt-1 w-full"
              disabled={submitting}
              type="submit"
            >
              {submitting && <span className="spinner !h-4 !w-4 !border-emerald-950/40 !border-t-emerald-950" />}
              {submitting
                ? "Please wait..."
                : mode === "signup"
                  ? "Create profile"
                  : "Login"}
            </button>
          </form>
        </div>

        {(message || error) && (
          <p className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-zinc-200 animate-fade-in">
            {message || error}
          </p>
        )}
      </section>
    </main>
  );
}
