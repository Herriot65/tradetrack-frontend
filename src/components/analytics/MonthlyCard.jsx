import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { formatPercent, formatValue, heatmapTone } from "@/lib/analytics";
import { cn } from "@/lib/utils";

import AnalyticsCard, { CardHeading, EmptyChart } from "./AnalyticsCard";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GRID_TEMPLATE = "48px repeat(12, minmax(0,1fr))";

export default function MonthlyCard({ analytics, bounds, onOpenMonth }) {
  useLanguage();
  const { months } = analytics;
  const years = bounds ? Array.from({ length: bounds.maxYear - bounds.minYear + 1 }, (_, i) => bounds.minYear + i) : [...new Set(months.map((month) => month.year))].sort((a, b) => a - b);
  const maxAbs = Math.max(0, ...months.map((month) => Math.abs(month.totalR)));
  const byKey = new Map(months.map((month) => [`${month.year}-${month.month}`, month]));

  return (
    <AnalyticsCard>
      <CardHeading title={t("Monthly net R")} />

      {months.length === 0 ? (
        <EmptyChart className="h-[180px]">{t("No closed trades in this range.")}</EmptyChart>
      ) : (
        <div className="overflow-x-auto px-5 pb-5 pt-5 min-[900px]:px-6 min-[900px]:pb-6">
          <div className="min-w-[720px] space-y-1">
            <div className="grid gap-1" style={{ gridTemplateColumns: GRID_TEMPLATE }}>
              <span />
              {MONTH_NAMES.map((month) => (
                <span key={month} className="text-center text-[11px] text-ink-muted">
                  {t(month)}
                </span>
              ))}
            </div>

            {years.map((year) => (
              <div
                key={year}
                className="grid items-center gap-1"
                style={{ gridTemplateColumns: GRID_TEMPLATE }}
              >
                <span className="text-[12px] tabular-nums text-ink-muted">{year}</span>
                {MONTH_NAMES.map((monthName, monthIndex) => {
                  const month = byKey.get(`${year}-${monthIndex}`);
                  if (!month) {
                    return (
                      <div
                        key={monthName}
                        className="h-11 rounded-[4px] border border-hairline bg-surface-raised"
                        aria-label={`${monthName} ${year}: no trades`}
                      />
                    );
                  }
                  const tone = heatmapTone(month.totalR, maxAbs);
                  return (
                    <button
                      key={monthName}
                      type="button"
                      onClick={() => onOpenMonth(year, monthIndex)}
                      title={`${month.label}: ${formatValue(month.totalR, "R")}, ${month.count} trades, ${formatPercent(month.winRate)} win rate`}
                      className={cn(
                        "flex h-11 min-w-0 items-center justify-center overflow-hidden rounded-[4px] border border-white/[0.04] px-0.5",
                        "text-[11px] tabular-nums text-ink outline-none transition-transform hover:scale-[1.03]",
                        "focus-visible:ring-2 focus-visible:ring-white/25",
                      )}
                      style={{ backgroundColor: tone.background, color: tone.color }}
                    >
                      <span className="truncate">{formatValue(month.totalR, "R")}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
}
