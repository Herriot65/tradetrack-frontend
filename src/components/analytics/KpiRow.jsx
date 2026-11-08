import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { formatPercent, formatRatio, formatValue } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function valueTone(value) {
  if (!Number.isFinite(Number(value)) || Number(value) === 0) return "text-ink";
  return Number(value) > 0 ? "text-profit" : "text-loss";
}

const DEFINITIONS = {
  "Net result": "Sum of all closed trade results in the active filters.",
  "Closed trades": "Number of completed trades in the selected period.",
  "Win rate": "Percentage of closed trades that closed in profit.",
  "Profit factor": "Gross profit divided by the absolute gross loss.",
  Expectancy: "Net result divided by the number of closed trades.",
  "Payoff ratio": "Average win divided by the absolute average loss.",
  "Max drawdown": "Largest decline from an equity peak, including the initial zero baseline.",
};
function KpiCard({ label, value, detail, tone = "text-ink" }) {
  useLanguage();
  return (
    <div className="analytics-card relative min-w-0 overflow-hidden rounded-xl border border-hairline bg-surface-card px-4 py-5 min-[900px]:px-5 min-[900px]:py-6">
      <span
        aria-hidden="true"
        className="absolute right-4 top-5 size-1 rounded-full bg-current opacity-50"
      />
      <p
        tabIndex={0}
        title={t(DEFINITIONS[label])}
        className="text-[12px] leading-4 text-ink-secondary"
      >
        {t(label)}
      </p>
      <p
        className={cn(
          "analytics-kpi-value mt-4 font-medium leading-9 tracking-[-0.045em] tabular-nums",
          tone,
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[12px] leading-5 text-ink-muted">{t(detail)}</p>
    </div>
  );
}

function StripCell({ label, value, detail, tone = "text-ink" }) {
  useLanguage();
  return (
    <div className="min-w-0 bg-surface-card px-4 py-3.5 min-[900px]:px-5">
      <p
        tabIndex={0}
        title={
          (DEFINITIONS[label] ? t(DEFINITIONS[label]) : null) ?? (label.includes("streak")
            ? t("Break-even trades neither extend nor break a streak.")
            : label === "Avg win"
              ? t("Gross profit divided by winning trades.")
              : t("Gross loss divided by losing trades."))
        }
        className="text-[12px] leading-4 text-ink-secondary"
      >
        {t(label)}
      </p>
      <p className={cn("mt-1.5 text-[15px] font-medium leading-5 tabular-nums", tone)}>
        <span>{value}</span>{" "}
        {detail && <span className="ml-1 text-[12px] font-normal text-ink-muted">{t(detail)}</span>}
      </p>
    </div>
  );
}

export default function KpiRow({ summary, unit, summaryOnly = false, overview = false, children }) {
  useLanguage();
  const hero = [
    {
      label: "Net result",
      value: formatValue(summary?.net, unit),
      detail: `${summary?.closedCount ?? 0} trades`,
      tone: valueTone(summary?.net),
    },
    {
      label: overview ? "Win rate" : "Expectancy",
      value: overview ? (summary?.closedCount ? formatPercent(summary.winRate) : "—") : formatValue(summary?.expectancy, unit),
      detail: overview ? "of closed trades" : "per trade",
      tone: overview ? "text-ink" : valueTone(summary?.expectancy),
    },
    {
      label: overview ? "Profit factor" : "Payoff ratio",
      value: formatRatio(overview ? summary?.profitFactor : summary?.payoff),
      detail: overview ? "gross profit ÷ gross loss" : "avg win ÷ avg loss",
      tone: "text-ink",
    },
    {
      label: "Max drawdown",
      value: formatValue(summary?.maxDrawdown, unit),
      detail: `Recovery factor ${formatRatio(summary?.recoveryFactor, 1)}`,
      tone: "text-loss",
    },
  ];

  const overviewHero = [
    {...hero[0], detail: "From closed trades"},
    hero[1],
    {...hero[3], detail: "Peak-to-trough decline"},
    {label: "Closed trades", value: String(summary?.closedCount ?? 0), detail: "In the selected period", tone: "text-ink"},
  ];

  const strip = [
    {
      label: "Avg win",
      value: formatValue(summary?.avgWin, unit),
      detail: "",
      tone: "text-profit",
    },
    {
      label: "Avg loss",
      value: formatValue(summary?.avgLoss, unit),
      detail: "",
      tone: "text-loss",
    },
    {
      label: "Win streak",
      value: String(summary?.maxWinStreak ?? 0),
      detail: `avg ${formatRatio(summary?.avgWinStreak, 1)}`,
      tone: "text-ink",
    },
    {
      label: "Loss streak",
      value: String(summary?.maxLossStreak ?? 0),
      detail: `avg ${formatRatio(summary?.avgLossStreak, 1)}`,
      tone: "text-ink",
    },
  ];

  return (
    <div data-testid="analytics-kpis" className="space-y-4">
      <div className="analytics-hero-grid grid grid-cols-2 items-stretch gap-4">
        {(overview ? overviewHero : hero).map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {children}

      {!summaryOnly && <div className="analytics-stats-grid grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline">
        {strip.map((stat) => (
          <StripCell key={stat.label} {...stat} />
        ))}
      </div>}
    </div>
  );
}
