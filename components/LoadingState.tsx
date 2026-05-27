type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = "Loading session...",
}: LoadingStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-50">
      <p className="text-sm text-zinc-400">{message}</p>
    </main>
  );
}
