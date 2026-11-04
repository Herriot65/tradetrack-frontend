import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Section, { SectionHeader } from "./Section";
import { steps } from "./landingData";
export default function HowItWorks() {
  return (
    <Section id="how-it-works" className="border-t border-border/60">
      <SectionHeader
        eyebrow="Your process, connected"
        title="From raw data to real improvement"
        description="A considered workflow. From the first entry to the patterns that shape your next decision."
        align="left"
      />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <article key={step.step} className="relative border-t border-border pt-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-[12px] text-primary">{step.step} /</span>
              <step.icon className="size-4 text-zinc-500" />
            </div>
            <h3 className="text-[16px] font-medium tracking-tight">{step.title}</h3>
            <p className="mt-3 text-[12px] leading-6 text-muted-foreground">{step.description}</p>
          </article>
        ))}
      </div>
      <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl border border-primary/15 bg-primary/[0.035] p-7 sm:flex-row sm:items-center sm:p-10">
        <div>
          <p className="nx-eyebrow mb-3">Make your next trade an informed one</p>
          <h3 className="text-2xl font-medium tracking-[-0.035em]">Your edge is in the details.</h3>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Give your trading process a place to grow.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/register">
            Create your journal
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
