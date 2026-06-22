"use client";

import { BenefitsSection } from "@/components/BenefitsSection";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { SubmissionSection } from "@/components/SubmissionSection";

export default function Home() {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-200">
      <HeroSection onNavigate={scrollToSection} />
      <BenefitsSection />
      <SubmissionSection />
      <HowItWorksSection />

      <footer className="border-t border-white/10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-zinc-200">Score Board</p>
            <p className="mt-1">Built with Next.js and Firebase.</p>
          </div>
          <p>&copy; 2026 Score Board. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
