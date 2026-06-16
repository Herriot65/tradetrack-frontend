import { CalendarDays } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr",
  "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec",
];

export default function MonthlySection({ selectedMonth, onMonthSelect }) {
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between px-6 pb-4 pt-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-zinc-600" />
          <CardTitle className="text-sm font-medium">Monthly Performance</CardTitle>
        </div>
        <span className="text-xs text-zinc-700">Heatmap coloring — Phase 2</span>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          {MONTHS.map((month, i) => {
            const isSelected = selectedMonth === i;
            return (
              <button
                key={month}
                onClick={() => onMonthSelect(isSelected ? null : i)}
                className={`group flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 ${
                  isSelected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-800/60 bg-zinc-900/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                <span className="font-medium">{month}</span>
                {/* Placeholder bar — will become a P&L indicator */}
                <div
                  className={`h-8 w-full rounded-sm transition-colors ${
                    isSelected ? "bg-emerald-500/25" : "bg-zinc-800/80 group-hover:bg-zinc-700/60"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
