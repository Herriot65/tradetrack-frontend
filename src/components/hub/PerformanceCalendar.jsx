import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDayStyle(d) {
  if (!d) return null; // no trades → transparent, no border
  // Day with only open positions (no closed trades yet)
  if (d.open > 0 && d.wins === 0 && d.losses === 0) {
    return {
      cell:  "bg-amber-500/10 border border-amber-500/20",
      text:  "text-amber-400",
      label: "OPEN",
    };
  }
  if (d.totalR > 0) return {
    cell:  "bg-emerald-500/15 border border-emerald-500/25",
    text:  "text-emerald-400",
    label: `+${d.totalR}`,
  };
  if (d.totalR < 0) return {
    cell:  "bg-red-500/15 border border-red-500/25",
    text:  "text-red-400",
    label: String(d.totalR),
  };
  // Break-even
  return {
    cell:  "bg-zinc-700/20 border border-zinc-600/20",
    text:  "text-zinc-500",
    label: "0",
  };
}

export default function PerformanceCalendar({ year, month, calendarData = {} }) {
  if (year == null || month == null) return null;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // JS getDay(): 0=Sun. Convert to ISO Monday-first (0=Mon … 6=Sun)
  const rawStart = new Date(year, month, 1).getDay();
  const startDow = (rawStart + 6) % 7;

  const cells = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Date(year, month).toLocaleDateString(undefined, {
    month: "long",
    year:  "numeric",
  });

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="px-5 pt-4 pb-3">
        <CardTitle className="text-sm font-medium">
          Trading Calendar — {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW_LABELS.map((d) => (
            <div key={d} className="text-center text-[9px] font-medium text-zinc-700 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[44px]" />;

            const d     = calendarData[day];
            const style = getDayStyle(d);

            return (
              <div
                key={i}
                className={`min-h-[44px] rounded flex flex-col items-center justify-center gap-0.5 p-1 ${
                  style ? style.cell : "bg-zinc-800/20"
                }`}
              >
                <span className="text-[9px] leading-none text-zinc-600">{day}</span>
                {style ? (
                  <span className={`text-[10px] font-bold leading-none ${style.text}`}>
                    {style.label}
                  </span>
                ) : (
                  <span className="text-[9px] leading-none text-zinc-800">·</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
          {[
            { color: "bg-emerald-500/30", label: "Profit" },
            { color: "bg-red-500/30",     label: "Loss" },
            { color: "bg-amber-500/25",   label: "Open" },
            { color: "bg-zinc-700/30",    label: "Break Even" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[9px] text-zinc-600">
              <span className={`size-2 rounded-sm inline-block ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
