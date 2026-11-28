import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import Section, { SectionHeader } from "./Section";
import { steps } from "./landingData";
export default function HowItWorks() {
  useLanguage();
  return (
    <Section id="how-it-works" className="border-t border-border/60">
      <SectionHeader
        eyebrow={t("How it works")}
        title={t("From raw data to real improvement")}
        align="left"
      />
      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((step) => (
          <article key={step.step} className="relative border-t border-border pt-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-[12px] text-primary">{step.step} /</span>
              <step.icon className="size-4 text-zinc-500" />
            </div>
            <h3 className="text-[16px] font-medium tracking-tight">{t(step.title)}</h3>
            <p className="mt-3 text-[12px] leading-6 text-muted-foreground">{t(step.description)}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
