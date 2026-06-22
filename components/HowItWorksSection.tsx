const workflowSteps = [
  {
    title: "Copy the prompt",
    body: "Start from the official prompt so every submission uses the same scoring frame.",
  },
  {
    title: "Run it in AI",
    body: "Paste the prompt into your preferred AI tool and generate the scorecard output.",
  },
  {
    title: "Paste and submit",
    body: "Paste the response here to validate the scorecard and update your analytics.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      className="scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8"
      id="how-it-works"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            A consistent 3-step workflow.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <article
              className="rounded-2xl border border-white/15 bg-zinc-900/80 p-5 shadow-lg shadow-black/30 transition hover:border-white/25 hover:bg-zinc-900 md:bg-white/[0.04]"
              key={step.title}
            >
              <span className="text-xs font-semibold text-emerald-200">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
