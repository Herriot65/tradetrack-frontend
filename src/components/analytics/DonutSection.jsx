import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { useState } from "react";

import { buildDonutSegments, formatPercent, formatRatio, formatValue } from "@/lib/analytics";
import { cn } from "@/lib/utils";

import AnalyticsCard, { CardHeading } from "./AnalyticsCard";

const RING_RADIUS = 50;
const RING_STROKE = 11;

function Donut({ values, colors, centerValue, centerLabel, labels, hovered, onHover }) {
  useLanguage();
  const circumference = 2 * Math.PI * RING_RADIUS;
  const segments = buildDonutSegments(values);

  return (
    <div className="analytics-donut relative size-[124px] shrink-0">
      <svg
        role="img"
        aria-label={centerLabel}
        viewBox="0 0 124 124"
        className="size-full -rotate-90"
      >
        <circle
          cx="62"
          cy="62"
          r={RING_RADIUS}
          fill="none"
          stroke="var(--surface-raised)"
          strokeWidth={RING_STROKE}
        />
        {segments.map((segment, index) => (
          <circle
            key={`${colors[index]}-${segment.start}`}
            cx="62"
            cy="62"
            r={RING_RADIUS}
            fill="none"
            stroke={colors[index]}
            strokeWidth={RING_STROKE}
            strokeDasharray={`${segment.length * circumference} ${circumference}`}
            strokeDashoffset={-segment.start * circumference}
            strokeLinecap="butt"
            className="cursor-pointer transition-opacity duration-150"
            opacity={hovered === null || hovered === index ? 1 : 0.25}
            tabIndex={0}
            role="button"
            aria-label={`${labels[index]}: ${formatPercent(segment.ratio * 100)}`}
            onFocus={() => onHover(index)}
            onBlur={() => onHover(null)}
            onPointerDown={() => onHover(index)}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[20px] font-medium leading-6 tabular-nums text-ink">
          {hovered === null ? centerValue : formatPercent(segments[hovered]?.ratio * 100)}
        </span>
        <span className="mt-0.5 text-[11px] leading-4 text-ink-muted">
          {hovered === null ? centerLabel : labels[hovered]}
        </span>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value, detail, hovered, onHover, index }) {
  useLanguage();
  return (
    <div
      className={cn(
        "grid cursor-default items-center gap-x-1.5 rounded-md px-1.5 py-2 text-[12px] leading-5 transition-colors",
        hovered === index && "bg-surface-raised",
      )}
      style={{ gridTemplateColumns: "8px minmax(0,1fr) auto 42px" }}
      tabIndex={0}
      onFocus={() => onHover(index)}
      onBlur={() => onHover(null)}
      onPointerDown={() => onHover(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="size-2 rounded-[2px]" style={{ backgroundColor: color }} />
      <span className="min-w-0 break-words text-ink-secondary">{t(label)}</span>
      <span className="whitespace-nowrap font-medium text-right tabular-nums text-ink">
        {value}
      </span>
      <span className="whitespace-nowrap text-right tabular-nums text-ink-muted">{t(detail)}</span>
    </div>
  );
}

function DonutCard({ title, children, footnote }) {
  useLanguage();
  return (
    <AnalyticsCard className="analytics-outcome">
      <CardHeading title={title} />
      <div className="analytics-donut-layout flex flex-col items-center gap-3 px-4 pb-5 pt-5">
        {children}
      </div>
      {footnote && (
        <p className="px-5 pb-5 min-[900px]:px-6 text-[12px] leading-4 text-ink-muted">
          {footnote}
        </p>
      )}
    </AnalyticsCard>
  );
}

export default function DonutSection({ analytics }) {
  useLanguage();
  const { summary, unit } = analytics;
  const [outcomeHover, setOutcomeHover] = useState(null);
  const [profitHover, setProfitHover] = useState(null);
  const total = Math.max(1, summary.closedCount);
  const profitFactor =
    summary.profitFactor === null
      ? summary.grossProfit > 0
        ? "\u221e"
        : "\u2014"
      : formatRatio(summary.profitFactor);

  return (
    <div className="analytics-outcomes-grid grid grid-cols-1 items-stretch gap-5">
      <DonutCard
        title={t("Win / loss")}
        footnote={
          summary.decidedCount > 0
            ? `${formatPercent(summary.decidedWinRate)} excluding break-even`
            : null
        }
      >
        <Donut
          values={[summary.wins, summary.losses, summary.breakEven]}
          colors={["var(--profit)", "var(--loss)", "var(--chart-neutral)"]}
          centerValue={formatPercent(summary.winRate)}
          labels={["Wins", "Losses", "Break-even"]}
          centerLabel="Win rate"
          hovered={outcomeHover}
          onHover={setOutcomeHover}
        />
        <div className="w-full min-w-0 space-y-1">
          <LegendRow
            color="var(--profit)"
            label={t("Wins")}
            value={summary.wins}
            detail={formatPercent((summary.wins / total) * 100)}
            hovered={outcomeHover}
            onHover={setOutcomeHover}
            index={0}
          />
          <LegendRow
            color="var(--loss)"
            label={t("Losses")}
            value={summary.losses}
            detail={formatPercent((summary.losses / total) * 100)}
            hovered={outcomeHover}
            onHover={setOutcomeHover}
            index={1}
          />
          <LegendRow
            color="var(--chart-neutral)"
            label={t("Break-even")}
            value={summary.breakEven}
            detail={formatPercent((summary.breakEven / total) * 100)}
            hovered={outcomeHover}
            onHover={setOutcomeHover}
            index={2}
          />
        </div>
      </DonutCard>

      <DonutCard title={t("Profit / loss")}>
        <Donut
          values={[summary.grossProfit, Math.abs(summary.grossLoss)]}
          colors={["var(--profit)", "var(--loss)"]}
          centerValue={profitFactor}
          labels={["Gross profit", "Gross loss"]}
          centerLabel="Profit factor"
          hovered={profitHover}
          onHover={setProfitHover}
        />
        <div className="w-full min-w-0">
          <div className="space-y-1">
            <LegendRow
              color="var(--profit)"
              label={t("Gross profit")}
              value={formatValue(summary.grossProfit, unit)}
              detail={formatPercent(
                (summary.grossProfit / (summary.grossProfit + Math.abs(summary.grossLoss) || 1)) *
                  100,
              )}
              hovered={profitHover}
              onHover={setProfitHover}
              index={0}
            />
            <LegendRow
              color="var(--loss)"
              label={t("Gross loss")}
              value={formatValue(summary.grossLoss, unit)}
              detail={formatPercent(
                (Math.abs(summary.grossLoss) /
                  (summary.grossProfit + Math.abs(summary.grossLoss) || 1)) *
                  100,
              )}
              hovered={profitHover}
              onHover={setProfitHover}
              index={1}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline px-1.5 pt-3 text-[12px] leading-4">
            <span className="text-ink-secondary">{t("Net")}</span>
            <span
              className={cn(
                "tabular-nums",
                summary.net > 0 ? "text-profit" : summary.net < 0 ? "text-loss" : "text-ink",
              )}
            >
              {formatValue(summary.net, unit)}
            </span>
          </div>
        </div>
      </DonutCard>
    </div>
  );
}
