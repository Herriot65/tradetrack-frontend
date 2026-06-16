import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PROFIT_COLOR = "hsl(142 70% 45%)";
const LOSS_COLOR   = "hsl(0 72% 51%)";

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs shadow-xl">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-zinc-400">{payload[0].payload.displayValue}R</p>
    </div>
  );
}

export default function ProfitLossDonut({ grossProfit = 0, grossLoss = 0, totalR = 0 }) {
  const hasData = grossProfit > 0 || grossLoss > 0;

  const data = [
    { name: "Profit", value: grossProfit, displayValue: `+${grossProfit}` },
    { name: "Loss",   value: grossLoss,   displayValue: `-${grossLoss}`   },
  ].filter((d) => d.value > 0);

  const sign = totalR > 0 ? "+" : "";
  const totalColor = totalR > 0 ? "hsl(142 70% 50%)" : totalR < 0 ? "hsl(0 72% 56%)" : "white";

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Profit / Loss</p>
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={hasData ? data : [{ name: "Empty", value: 1, displayValue: "0" }]}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={58}
            dataKey="value"
            strokeWidth={0}
            paddingAngle={hasData ? 2 : 0}
          >
            {hasData && (
              <>
                <Cell fill={PROFIT_COLOR} />
                <Cell fill={LOSS_COLOR} />
              </>
            )}
            {!hasData && <Cell fill="hsl(0 0% 20%)" />}
            <Label
              content={({ viewBox }) => {
                const { cx, cy } = viewBox;
                return (
                  <g>
                    <text x={cx} y={cy - 5} textAnchor="middle" fill={totalColor} fontSize={15} fontWeight={600}>
                      {sign}{totalR}R
                    </text>
                    <text x={cx} y={cy + 12} textAnchor="middle" fill="hsl(0 0% 45%)" fontSize={9}>
                      NET R
                    </text>
                  </g>
                );
              }}
            />
          </Pie>
          {hasData && <Tooltip content={<DonutTooltip />} />}
        </PieChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
          <span className="text-zinc-400">+{grossProfit}R</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-red-500" />
          <span className="text-zinc-400">-{grossLoss}R</span>
        </span>
      </div>
    </div>
  );
}
