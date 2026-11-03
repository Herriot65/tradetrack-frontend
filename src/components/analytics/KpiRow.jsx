import { formatRatio, formatValue } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function valueTone(value) {
  if (!Number.isFinite(Number(value)) || Number(value) === 0) return "text-ink";
  return Number(value) > 0 ? "text-profit" : "text-loss";
}

const DEFINITIONS = {
  "Net result": "Sum of all closed trade results in the active filters.",
  "Expectancy": "Net result divided by the number of closed trades.",
  "Payoff ratio": "Average win divided by the absolute average loss.",
  "Max drawdown": "Largest decline from an equity peak, including the initial zero baseline.",
};
function KpiCard({ label, value, detail, tone = "text-ink" }) {
  return (
    <div className="rounded-xl bg-surface-card px-4 py-3.5">
      <p tabIndex={0} title={DEFINITIONS[label]} className="text-[12px] leading-4 text-ink-secondary">{label}</p>
      <p className={cn("mt-1 text-[24px] font-medium leading-7 tabular-nums", tone)}>
        {value}
      </p>
      <p className="mt-0.5 text-[12px] leading-4 text-ink-muted">{detail}</p>
    </div>
  );
}

function StripCell({ label, value, detail, tone = "text-ink" }) {
  return (
    <div className="min-w-0 bg-surface-card px-3.5 py-2.5">
      <p tabIndex={0} title={label.includes("streak") ? "Break-even trades neither extend nor break a streak." : label === "Avg win" ? "Gross profit divided by winning trades." : "Gross loss divided by losing trades."} className="text-[12px] leading-4 text-ink-secondary">{label}</p>
      <p className={cn("mt-0.5 text-[15px] font-medium leading-5 tabular-nums", tone)}>
        {value} {detail && <span className="ml-1 text-[12px] font-normal text-ink-muted">{detail}</span>}
      </p>
    </div>
  );
}

export default function KpiRow({ summary, unit }) {
  const hero = [
    {
      label: "Net result",
      value: formatValue(summary?.net, unit),
      detail: `${summary?.closedCount ?? 0} trades`,
      tone: valueTone(summary?.net),
    },
    {
      label: "Expectancy",
      value: formatValue(summary?.expectancy, unit),
      detail: "per trade",
      tone: valueTone(summary?.expectancy),
    },
    {
      label: "Payoff ratio",
      value: formatRatio(summary?.payoff),
      detail: "avg win \u00f7 avg loss",
      tone: "text-ink",
    },
    {
      label: "Max drawdown",
      value: formatValue(summary?.maxDrawdown, unit),
      detail: `Recovery factor ${formatRatio(summary?.recoveryFactor, 1)}`,
      tone: "text-loss",
    },
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
    <div data-testid="analytics-kpis" className="space-y-3">
      <div className="grid grid-cols-2 items-start gap-3 min-[900px]:grid-cols-4">
        {hero.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-hairline bg-hairline min-[1200px]:grid-cols-4">
        {strip.map((stat) => (
          <StripCell key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}
