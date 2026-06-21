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
      window.setTimeout(() => setCopyMessage(""), 1800);
    } catch {
      setCopyMessage("Could not copy prompt.");
    }
  };

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <p className="eyebrow">Daily Prompt</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {prompt.title}
          </h1>
        </div>

        <button
          className="btn btn-primary shrink-0"
          onClick={handleCopy}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Copy Prompt
        </button>
      </div>

      <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2 sm:p-6">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
          <dt className="text-xs text-zinc-500">Version</dt>
          <dd className="mt-1 font-semibold text-white">
            v{prompt.version}
          </dd>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
          <dt className="text-xs text-zinc-500">Created</dt>
          <dd className="mt-1 font-semibold text-white">
            {formatDate(prompt.createdAt)}
          </dd>
        </div>
      </dl>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-[var(--surface-0)] p-4 font-mono text-[13px] leading-6 text-zinc-200">
          {prompt.content}
        </pre>
      </div>

      {copyMessage && (
        <div className="border-t border-white/[0.07] px-5 py-3 text-sm font-medium text-emerald-300 sm:px-6">
          {copyMessage}
        </div>
      )}
    </article>
  );
}
