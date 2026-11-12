import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";

export default function ProductPreview() {
  useLanguage();
  return (
    <figure className="nx-product-preview overflow-hidden rounded-2xl border border-zinc-700/70 bg-card shadow-2xl shadow-black/30">
      <img
        src="/screenshots/workspace-overview.png"
        alt={t("Nexora overview showing an equity curve, key metrics, and recent trades using sample data.")}
        width={1440}
        height={1368}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full"
      />
      <figcaption className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
        {t("Actual Nexora workspace with synthetic sample trades. Your journal shows your own results.")}
      </figcaption>
    </figure>
  );
}
