"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-zinc-50">
      <section className="card max-w-md p-6 text-center">
        <p className="eyebrow">Dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Dashboard could not load.
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Your data is still safe. Retry the dashboard view.
        </p>
        <button className="btn btn-primary mt-5" onClick={reset} type="button">
          Retry
        </button>
      </section>
    </main>
  );
}
