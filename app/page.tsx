import { ApiBlock } from "@/components/hermit/apiBlock";
import { Features } from "@/components/hermit/features";
import { Hero } from "@/components/hermit/hero";
import { Metrics } from "@/components/hermit/metrics";
import { Pipeline } from "@/components/hermit/pipeline";
import { Roadmap } from "@/components/hermit/roadmap";
import { Section } from "@/components/hermit/section";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "hermit: Solana bridge transaction indexer",
  description:
    "A real-time indexer that decodes bridge transactions straight from Solana data, in both directions, and streams every transfer live.",
};

export default function HermitPage() {
  return (
    <main className="min-h-screen antialiased">
      <div className="mx-auto w-full max-w-[940px] px-6">
        <Hero />

        <Section
          id="pipeline"
          label="01 / pipeline"
          title="From a Solana log line to a stored, enriched transfer."
        >
          <Pipeline />
        </Section>

        <Section
          id="numbers"
          label="02 / numbers"
          title="Measured, not estimated."
        >
          <Metrics />
        </Section>

        <Section
          id="design"
          label="03 / design"
          title="The chain is the source of truth."
        >
          <Features />
        </Section>

        <Section id="api" label="04 / api" title="Versioned, with a live stream.">
          <ApiBlock />
        </Section>

        <Section id="status" label="05 / status" title="What is built and what is next.">
          <Roadmap />
        </Section>

        <Footer />
      </div>
    </main>
  );
}