"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { PromptWithId } from "@/types/prompt";

type ActivePromptCardProps = {
  prompt: PromptWithId;
};

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

export function ActivePromptCard({ prompt }: ActivePromptCardProps) {
  const [copyMessage, setCopyMessage] = useState("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopyMessage("Prompt copied.");
    } catch {
      setCopyMessage("Could not copy prompt.");
    }
  };

  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Daily Prompt
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{prompt.title}</h1>
        </div>

        <button
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
          onClick={handleCopy}
          type="button"
        >
          Copy Prompt
        </button>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-400">Version</dt>
          <dd className="mt-1 font-medium">v{prompt.version}</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Created</dt>
          <dd className="mt-1 font-medium">{formatDate(prompt.createdAt)}</dd>
        </div>
      </dl>

      <pre className="mt-5 whitespace-pre-wrap rounded-md border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-100">
        {prompt.content}
      </pre>

      {copyMessage && (
        <p className="mt-3 text-sm text-zinc-300">{copyMessage}</p>
      )}
    </article>
  );
}
