import { Skeleton } from "@/components/ui/skeleton";
import InfoTip from "@/components/ui/InfoTip";

const COLORS = {
  emerald: {
    accent:  "border-l-emerald-500/70",
    bg:      "bg-emerald-950/20",
    value:   "text-emerald-400",
    icon:    "text-emerald-400",
    iconBg:  "bg-emerald-500/10",
  },
  red: {
    accent:  "border-l-red-500/70",
    bg:      "bg-red-950/15",
    value:   "text-red-400",
    icon:    "text-red-400",
    iconBg:  "bg-red-500/10",
  },
  amber: {
    accent:  "border-l-amber-500/60",
    bg:      "bg-amber-950/15",
    value:   "text-amber-400",
    icon:    "text-amber-400",
    iconBg:  "bg-amber-500/10",
  },
  zinc: {
    accent:  "border-l-zinc-700/50",
    bg:      "",
    value:   "text-zinc-100",
    icon:    "text-zinc-500",
    iconBg:  "bg-zinc-800/60",
  },
};

export default function KpiCard({ label, icon: Icon, value, loading, color = "zinc", info }) {
  const c = COLORS[color] ?? COLORS.zinc;

  return (
    <div
      className={`
        flex flex-col gap-3 rounded-xl border border-zinc-800/60 border-l-2 ${c.accent} ${c.bg}
        bg-zinc-900/60 p-5
        shadow-[0_1px_4px_rgba(0,0,0,0.35)]
        transition-shadow duration-150 hover:shadow-[0_3px_12px_rgba(0,0,0,0.45)]
      `}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`flex size-6 shrink-0 items-center justify-center rounded-md ${c.iconBg}`}>
              <Icon className={`size-3 ${c.icon}`} />
            </div>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 leading-tight">
            {label}
          </span>
        </div>
        <InfoTip text={info} />
      </div>

      {/* Value */}
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className={`text-2xl font-bold tracking-tight leading-none ${c.value}`}>
          {value ?? "—"}
        </p>
      )}
    </div>
  );
}
