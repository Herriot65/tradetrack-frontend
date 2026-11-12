import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useAuth } from "@/auth/useAuth";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Section from "./Section";
import ImmersiveScene from "./ImmersiveScene";
import ProductPreview from "./ProductPreview";

export default function Hero() {
  useLanguage();
  const { isAuthenticated } = useAuth();
  return (
    <Section className="nx-immersive-hero">
      <div className="nx-hero-atmosphere" aria-hidden="true" />
      <div className="nx-immersive-layout">
        <div className="nx-hero-copy">
          <p className="nx-eyebrow mb-7 flex items-center gap-2"><Activity className="size-3.5" />{t('Trading intelligence, made personal')}</p>
          <h1>{t('Know your edge.')}<br/><span>{t('Trade it with')}</span><br/>{t('confidence.')}</h1>
          <p className="nx-hero-description">{t('Your trade history has a story to tell. Nexora brings your journal, analytics, and trading process into one clear picture—so you can stop guessing and start improving.')}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg"><Link to={isAuthenticated ? '/dashboard' : '/register'}>{isAuthenticated ? t('Dashboard') : t('Get started')}<ArrowRight className="size-4" /></Link></Button>
            <Button asChild variant="outline" size="lg"><a href="#features">{t('Explore Nexora')}<ArrowDown className="size-3.5" /></a></Button>
          </div>
          <p className="mt-5 text-[11px] text-muted-foreground">{t('Built for serious traders. Designed for your daily process.')}</p>
        </div>
        <ImmersiveScene />
      </div>
      <div className="nx-preview-stage relative mt-14 md:mt-20">
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
