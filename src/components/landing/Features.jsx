import FeatureCard from "./FeatureCard";
import Section, { SectionHeader } from "./Section";
import { features } from "./landingData";

export default function Features() {
  return (
    <Section id="features" className="border-t border-zinc-800/40">
      <SectionHeader
        eyebrow="Features"
        title="Everything you need to level up"
        description="From trade logs to psychology scores — one platform to understand your performance inside and out."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </Section>
  );
}
