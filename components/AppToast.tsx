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
      ? "bg-emerald-500 text-emerald-950"
      : "bg-zinc-700 text-zinc-100";

  return (
    <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 animate-[toast-in_180ms_ease-out] sm:left-5 sm:translate-x-0">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-sm font-semibold text-zinc-100 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${iconClasses}`}
        >
          ✓
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
