import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Section from "./Section";
import ProductPreview from "./ProductPreview";

export default function Hero() {
  useLanguage();
  return (
    <Section className="overflow-hidden !pb-16 !pt-32 md:!pb-24 md:!pt-44">
      <div
        aria-hidden="true"
        className="nx-market-grid pointer-events-none absolute inset-x-0 top-0 h-[720px] opacity-50 [mask-image:linear-gradient(black,transparent)]"
      />
      <div className="relative grid items-end gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <div>
          <p className="nx-eyebrow mb-7 flex items-center gap-2">
            <Activity className="size-3.5" />{t("Trading intelligence, made personal")}</p>
          <h1>{t("Know your edge.")}<br />
            <span className="text-primary">{t("Trade it with")}</span>
            <br />{t("confidence.")}</h1>
        </div>
        <div className="pb-2">
          <p className="max-w-md text-[15px] leading-7 text-muted-foreground">{t("Your trade history has a story to tell. Nexora brings your journal, analytics, and trading process into one clear picture—so you can stop guessing and start improving.")}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/register">{t("Get started")}<ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#features">{t("Explore Nexora")}<ArrowDown className="size-3.5" />
              </a>
            </Button>
          </div>
          <p className="mt-5 text-[11px] text-zinc-500">{t("Built for serious traders. Designed for your daily process.")}</p>
        </div>
      </div>
      <div className="relative mt-14 md:mt-20">
        <ProductPreview />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
        <span>{t("Multi-journal logging")}</span>
        <span>{t("MT5 import")}</span>
        <span>{t("Performance analytics")}</span>
        <span>{t("Session insights")}</span>
      </div>
    </Section>
  );
}
