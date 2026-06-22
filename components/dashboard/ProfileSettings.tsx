"use client";

import { FormEvent } from "react";

type ProfileSettingsProps = {
  message: string;
  saving: boolean;
  username: string;
  setUsername: (username: string) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
};

export function ProfileSettings({
  message,
  saving,
  username,
  setUsername,
  onSave,
}: ProfileSettingsProps) {
  return (
    <div className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">Profile Settings</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Update your display username.
      </p>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onSave}>
        <input
          className="input sm:flex-1"
          onChange={(event) => setUsername(event.target.value)}
          value={username}
        />
        <button
          className="btn btn-primary sm:w-auto"
          disabled={saving}
          type="submit"
        >
          {saving && (
            <span className="spinner !h-4 !w-4 !border-emerald-950/40 !border-t-emerald-950" />
          )}
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            message === "Username saved."
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-white/[0.04] text-zinc-300"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
