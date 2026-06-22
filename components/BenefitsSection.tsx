const platformBenefits = [
  {
    title: "Track Growth",
    body: "Monitor how your skills evolve over time.",
    icon: "01",
  },
  {
    title: "Discover Strengths",
    body: "Identify the areas where you consistently perform well.",
    icon: "02",
  },
  {
    title: "Find Improvement Areas",
    body: "Recognize opportunities for focused growth.",
    icon: "03",
  },
  {
    title: "Compare Progress",
    body: "See how you rank alongside leaderboard users.",
    icon: "04",
  },
];

export function BenefitsSection() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-7 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Benefits
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            See your progress from every useful angle.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformBenefits.map((benefit) => (
            <article
              className="min-w-0 rounded-2xl border border-white/15 bg-zinc-900/80 p-5 shadow-lg shadow-black/30 transition hover:border-white/25 hover:bg-zinc-900 sm:bg-white/[0.04]"
              key={benefit.title}
            >
              <span className="text-xs font-semibold text-emerald-200">
                {benefit.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {benefit.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
