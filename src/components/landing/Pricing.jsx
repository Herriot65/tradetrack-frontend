import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import PricingCard from "./PricingCard";
import Section, { SectionHeader } from "./Section";
import { pricingTiers } from "./landingData";

export default function Pricing() {
  useLanguage();
  return (
    <Section id="pricing" className="border-t border-zinc-800/40">
      <SectionHeader
        eyebrow="Pricing"
        title={t("Simple, transparent pricing")}
        description={t("Start free and upgrade when you're ready. No hidden fees, cancel anytime.")}
      />

      <div className="grid gap-6 pt-4 lg:grid-cols-3 lg:gap-8">
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} {...tier} />
        ))}
      </div>
    </Section>
  );
}
