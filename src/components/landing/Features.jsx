import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import FeatureCard from "./FeatureCard";
import Section, { SectionHeader } from "./Section";
import { features } from "./landingData";

export default function Features() {
  useLanguage();
  return (
    <Section id="features" className="border-t border-border/60">
      <SectionHeader
        eyebrow="Built for the way you trade"
        title={t("Less noise. More understanding.")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </Section>
  );
}
