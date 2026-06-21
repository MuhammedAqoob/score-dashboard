type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = "Loading session...",
}: LoadingStateProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--background)] px-6 text-zinc-50">
      <div className="flex items-center gap-2.5">
        <span className="spinner" />
        <span className="text-sm font-medium text-zinc-300">{message}</span>
      </div>
    </main>
  );
}
