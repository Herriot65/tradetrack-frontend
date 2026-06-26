import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import InfoTip from "@/components/ui/InfoTip";

const WIN_COLOR  = "hsl(142 70% 45%)";
const LOSS_COLOR = "hsl(0 72% 51%)";
const BE_COLOR   = "hsl(0 0% 42%)";

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs shadow-xl">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-zinc-400">{payload[0].value} trades</p>
    </div>
  );
}

export default function WinLossDonut({ wins = 0, losses = 0, breakEven = 0 }) {
  const total = wins + losses + breakEven;
  const winRate = total > 0 ? Math.round((wins / total) * 10000) / 100 : 0;

  const data = [
    { name: "Wins",       value: wins,      fill: WIN_COLOR  },
    { name: "Losses",     value: losses,    fill: LOSS_COLOR },
    { name: "Break Even", value: breakEven, fill: BE_COLOR   },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Win / Loss</p>
        <InfoTip text="Trade outcome distribution — wins, losses, and break-even trades. The centre shows your overall win rate." />
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={total > 0 ? data : [{ name: "Empty", value: 1, fill: "hsl(0 0% 20%)" }]}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={58}
            dataKey="value"
            strokeWidth={0}
            paddingAngle={total > 0 ? 2 : 0}
          >
            {total > 0 && data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
            <Label
              content={({ viewBox }) => {
                const { cx, cy } = viewBox;
                return (
                  <g>
                    <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize={15} fontWeight={600}>
                      {winRate}%
                    </text>
                    <text x={cx} y={cy + 12} textAnchor="middle" fill="hsl(0 0% 45%)" fontSize={9}>
                      WIN RATE
                    </text>
                  </g>
                );
              }}
            />
          </Pie>
          {total > 0 && <Tooltip content={<DonutTooltip />} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          <span className="text-zinc-400">{wins}W</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-red-500" />
          <span className="text-zinc-400">{losses}L</span>
        </span>
        {breakEven > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-zinc-500" />
            <span className="text-zinc-400">{breakEven}BE</span>
          </span>
        )}
      </div>
    </div>
  );
}
