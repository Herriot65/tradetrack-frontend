import { Skeleton } from "@/components/ui/skeleton";
import InfoTip from "@/components/ui/InfoTip";

const COLORS = {
  emerald: {
    accent: "border-l-emerald-500/70",
    bg:     "bg-emerald-950/20",
    value:  "text-emerald-400",
    icon:   "text-emerald-600",
  },
  red: {
    accent: "border-l-red-500/70",
    bg:     "bg-red-950/15",
    value:  "text-red-400",
    icon:   "text-red-700",
  },
  amber: {
    accent: "border-l-amber-500/60",
    bg:     "bg-amber-950/15",
    value:  "text-amber-400",
    icon:   "text-amber-700",
  },
  zinc: {
    accent: "border-l-zinc-700/40",
    bg:     "",
    value:  "text-zinc-100",
    icon:   "text-zinc-600",
  },
};

export default function KpiCard({ label, icon: Icon, value, loading, color = "zinc", info }) {
  const c = COLORS[color] ?? COLORS.zinc;

  return (
    <div
      className={`
        rounded-lg border border-zinc-800/60 border-l-2 ${c.accent} ${c.bg}
        bg-zinc-900/40 p-4 flex flex-col gap-2.5
      `}
    >
      {/* Label row */}
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={`size-3 shrink-0 ${c.icon}`} />}
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 leading-tight">
          {label}
        </span>
        <InfoTip text={info} />
      </div>

      {/* Value */}
      {loading ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <p className={`text-2xl font-bold tracking-tight leading-none ${c.value}`}>
          {value ?? "—"}
        </p>
      )}
    </div>
  );
}
