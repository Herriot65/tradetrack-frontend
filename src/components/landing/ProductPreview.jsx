import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { ArrowUpRight, BookOpen, ChevronDown } from "lucide-react";
import KpiRow from "@/components/analytics/KpiRow";
import EquitySection from "@/components/analytics/EquitySection";
import { computeAnalytics } from "@/lib/analytics";

// Marketing illustration only: reuse the original landing preview's series,
// rendered through the real analytics components and calculations.
const levels = [38, 42, 40, 46, 44, 50, 48, 54, 51, 57, 55, 61, 59, 65, 63, 68];
const illustration = computeAnalytics(
  levels
    .slice(1)
    .map((level, index) => ({
      id: index + 1,
      pnl_r: (level - levels[index]) / 10,
      entry_datetime: new Date(Date.UTC(2025, 0, index * 5 + 1, 10)).toISOString(),
      exit_datetime: new Date(Date.UTC(2025, 0, index * 5 + 1, 11)).toISOString(),
      asset: { symbol: "EURUSD" },
    })),
);

export default function ProductPreview() {
  useLanguage();
  return (
    <figure className="nx-product-preview analytics-page overflow-hidden rounded-2xl border border-zinc-700/70 bg-card shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <span className="flex items-center gap-2 text-xs text-zinc-300">
          <BookOpen className="size-3.5 text-primary" />{t("Trading journal")}<ChevronDown className="size-3 text-zinc-500" />
        </span>
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-zinc-500">{t("Product preview")}<ArrowUpRight className="size-3" />
        </span>
      </div>
      <div className="px-4 pt-5 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-lg font-medium tracking-tight">{t("Performance")}</span>
          <span className="rounded-md border border-border bg-background px-2 py-1 text-[10px] text-zinc-400">{t("All time · R")}</span>
        </div>
        <KpiRow summary={illustration.summary} unit="R" />
        <div className="mt-4">
          <EquitySection analytics={illustration} />
        </div>
      </div>
      <figcaption className="border-t border-border px-4 py-3 text-center text-[10px] text-muted-foreground">{t("Illustrative trading data. Your journal displays your own performance.")}</figcaption>
    </figure>
  );
}
