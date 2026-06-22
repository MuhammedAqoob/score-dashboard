"use client";

import { FormEvent, useState } from "react";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import {
  DEFAULT_ACTIVE_PROMPT_CONTENT,
  DEFAULT_ACTIVE_PROMPT_TITLE,
  EXPECTED_SCORECARD_FORMAT,
  saveActivePrompt,
} from "@/services/promptService";
import { PromptWithId } from "@/types/prompt";

type AdminPromptManagerProps = {
  prompt: PromptWithId | null;
  promptLoading: boolean;
  reloadPrompt: () => Promise<void>;
  setMessage: (message: string) => void;
  showToast: (message: string) => void;
};

export function AdminPromptManager({
  prompt,
  promptLoading,
  reloadPrompt,
  setMessage,
  showToast,
}: AdminPromptManagerProps) {
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
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
      await reloadPrompt();
      showToast("Prompt saved");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save prompt.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUseStructuredDefault = () => {
    setTitle(DEFAULT_ACTIVE_PROMPT_TITLE);
    setContent(DEFAULT_ACTIVE_PROMPT_CONTENT);
    setVersion(versionValue + 1);
    setMessage("Structured default prompt loaded. Save to publish it.");
  };

  return (
    <AdminSectionShell
      eyebrow="Content"
      title="Prompt Manager"
      description="Edit the active prompt. The parser depends on the structured scorecard block."
    >
      <form className="min-w-0" onSubmit={handleSavePrompt}>
        {promptLoading && (
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="spinner" />
            Loading prompt...
          </div>
        )}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4 text-sm text-amber-100">
          <p className="font-semibold">Scorecard format is required.</p>
          <p className="mt-1 text-amber-100/80">
            The parser depends on exact scorecard keys inside BEGIN_SCORECARD
            and END_SCORECARD. Keep the structured block at the top of the
            prompt output requirements.
          </p>
          <button
            className="btn btn-ghost mt-3 !min-h-9 !px-3 !text-xs !text-amber-100"
            onClick={handleUseStructuredDefault}
            type="button"
          >
            Load Structured Default
          </button>
        </div>
        <details className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-200">
            Expected AI Output Format
          </summary>
          <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-white/[0.07] bg-[var(--surface-0)] p-3 font-mono text-xs leading-5 text-zinc-300">
            {EXPECTED_SCORECARD_FORMAT}
          </pre>
        </details>
        <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
          Title
          <input
            className="input"
            onChange={(event) => setTitle(event.target.value)}
            value={titleValue}
          />
        </label>
        <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
          Version
          <input
            className="input"
            min={1}
            onChange={(event) => setVersion(Number(event.target.value))}
            type="number"
            value={versionValue}
          />
        </label>
        <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-zinc-200">
          Content
          <textarea
            className="input min-h-80 resize-y font-mono leading-6"
            onChange={(event) => setContent(event.target.value)}
            value={contentValue}
          />
        </label>
        <button
          className="btn btn-save-prompt mt-5 w-full sm:w-auto"
          disabled={saving}
          type="submit"
        >
          {saving && (
            <span className="spinner !h-4 !w-4 !border-emerald-950/40 !border-t-emerald-950" />
          )}
          {saving ? "Saving..." : "Save Active Prompt"}
        </button>
      </form>
    </AdminSectionShell>
  );
}
