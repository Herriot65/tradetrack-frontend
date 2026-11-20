import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useDesign } from "@/lib/design";

export default function ProductPreview() {
  useLanguage();
  const [design] = useDesign();
  const immersive = design === "3d";
  return (
    <figure className="nx-product-preview overflow-hidden rounded-2xl border border-zinc-700/70 bg-card shadow-2xl shadow-black/30">
      <img
        src={immersive ? "/screenshots/workspace-overview.png" : "/screenshots/journal-analytics.jpg"}
        alt={t(immersive ? "Nexora overview showing an equity curve, key metrics, and recent trades using sample data." : "Nexora journal analytics showing trade performance, an equity curve, and a drawdown chart using sample trades.")}
        width={immersive ? 1440 : 2160}
        height={immersive ? 1368 : 2520}
        fetchPriority={immersive ? "auto" : "high"}
        loading={immersive ? "lazy" : "eager"}
        decoding="async"
        className="block h-auto w-full"
      />
      <figcaption className="border-t border-border px-4 py-3 text-center text-[11px] text-muted-foreground">
        {t("Actual Nexora workspace with synthetic sample trades. Your journal shows your own results.")}
      </figcaption>
    </figure>
  );
}
