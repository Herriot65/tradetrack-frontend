import FeatureCard from "./FeatureCard";
import Section, { SectionHeader } from "./Section";
import { features } from "./landingData";

export default function Features() {
  return (
    <Section id="features" className="border-t border-zinc-800/40">
      <SectionHeader
        eyebrow="Built for the way you trade"
        title="Less noise. More understanding."
        description="One focused workspace to capture the details, measure your performance, and see what makes your best trading different."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </Section>
  );
}
