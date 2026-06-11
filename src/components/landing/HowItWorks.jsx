import Section, { SectionHeader } from "./Section";
import { steps } from "./landingData";

export default function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      className="border-t border-zinc-800/40 bg-zinc-900/20"
    >
      <SectionHeader
        eyebrow="How it works"
        title="From raw data to real improvement"
        description="Four simple steps to transform how you review, analyze, and optimize your trading."
      />

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="relative">
            {index < steps.length - 1 && (
              <div className="absolute left-8 top-16 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-emerald-500/40 to-transparent lg:block" />
            )}

            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <step.icon className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Step {step.step}
              </span>
            </div>

            <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
