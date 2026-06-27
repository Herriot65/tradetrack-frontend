import FeatureCard from "./FeatureCard";
import Section, { SectionHeader } from "./Section";
import { features } from "./landingData";

export default function Features() {
  return (
    <Section id="features" className="border-t border-zinc-800/40">
      <SectionHeader
        eyebrow="Features"
        title="Everything you need to find your edge"
        description="One platform to log trades, understand your numbers, and discover the patterns that separate your best sessions from your worst."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </Section>
  );
}
