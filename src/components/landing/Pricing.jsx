import PricingCard from "./PricingCard";
import Section, { SectionHeader } from "./Section";
import { pricingTiers } from "./landingData";

export default function Pricing() {
  return (
    <Section id="pricing" className="border-t border-zinc-800/40">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        description="Start free and upgrade when you're ready. No hidden fees, cancel anytime."
      />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {pricingTiers.map((tier) => (
          <PricingCard key={tier.name} {...tier} />
        ))}
      </div>
    </Section>
  );
}
