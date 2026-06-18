type AppToastProps = {
  message: string;
  tone?: "success" | "neutral";
};

export function AppToast({ message, tone = "success" }: AppToastProps) {
  if (!message) {
    return null;
  }

  const iconClasses =
    tone === "success"
      ? "border-emerald-700/60 bg-emerald-500 text-zinc-950"
      : "border-zinc-700 bg-zinc-800 text-zinc-100";

  return (
    <div className="fixed bottom-4 left-4 z-[70] animate-[toast-in_180ms_ease-out] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${iconClasses}`}
        >
          ✓
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
