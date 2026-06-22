"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-zinc-50">
      <section className="card max-w-md p-6 text-center">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Admin panel could not load.
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Retry the admin view to reconnect.
        </p>
        <button className="btn btn-primary mt-5" onClick={reset} type="button">
          Retry
        </button>
      </section>
    </main>
  );
}
