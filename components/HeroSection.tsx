"use client";

type HeroSectionProps = {
  onNavigate: (sectionId: string) => void;
};

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100svh-4.25rem)] w-full max-w-7xl flex-col justify-center px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-12 lg:px-8">
      <div className="max-w-4xl">
        <p className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
          Skill Profile Tracker
        </p>
        <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
          Track how your thinking evolves over time.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
          Submit AI-evaluated scorecards, validate the results, and uncover
          patterns in your problem-solving, learning, and execution skills.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-zinc-100 px-6 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-300 active:scale-[0.98]"
            onClick={() => onNavigate("submission")}
            type="button"
          >
            Start Analysis
          </button>
          <button
            className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.05] active:scale-[0.98]"
            onClick={() => onNavigate("how-it-works")}
            type="button"
          >
            How It Works
          </button>
        </div>
      </div>
    </section>
  );
}
