import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import Section from "./Section";

const MOCK_STATS = [
  { label: "Win Rate",      value: "58.3%", sub: "+4.1% vs last month" },
  { label: "Expectancy",   value: "+0.44R", sub: "per closed trade"    },
  { label: "Max Drawdown", value: "−3.2R",  sub: "peak to trough"      },
];

const EQUITY_BARS = [38, 42, 40, 46, 44, 50, 48, 54, 51, 57, 55, 61, 59, 65, 63, 68];

export default function Hero() {
  return (
    <Section className="overflow-hidden pb-16 pt-32 md:pb-24 md:pt-40">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/80 via-zinc-950 to-zinc-950" />
      </div>

      {/* Headline */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-300">
          <Sparkles className="size-3.5" />
          Built for serious traders
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.1]">
          Know your edge.{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Trade it with confidence.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          TradeTrack Analytics turns your trade log into a complete performance
          picture — equity curve, streak analysis, session heatmaps, and
          expectancy — so you stop guessing and start improving.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link to="/register">
              Start Free Trial
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-6 text-base">
            <a href="#features">See Features</a>
          </Button>
        </div>

        <p className="mt-4 text-sm text-zinc-500">
          No credit card required · Free plan available
        </p>
      </div>

      {/* Mock dashboard */}
      <div className="relative mx-auto mt-16 max-w-4xl">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/20 via-zinc-800/50 to-transparent" />
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-1 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <div className="rounded-xl bg-zinc-950/80 p-4 sm:p-6">

            {/* Window chrome */}
            <div className="mb-4 flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-red-500/80" />
              <div className="size-2.5 rounded-full bg-yellow-500/80" />
              <div className="size-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs text-zinc-500">Journal · Analytics</span>
            </div>

            {/* KPI row */}
            <div className="grid gap-3 sm:grid-cols-3">
              {MOCK_STATS.map((s) => (
                <div key={s.label} className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-4">
                  <p className="text-xs text-zinc-500">{s.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${s.value.startsWith("−") ? "text-red-400" : "text-white"}`}>
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-emerald-400">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Equity curve */}
            <div className="mt-3 rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">Equity Curve (R)</p>
                <p className="text-xs text-emerald-400">+12.6R YTD</p>
              </div>
              <div className="flex h-20 items-end gap-0.5">
                {EQUITY_BARS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-emerald-600/40 to-emerald-400/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom mini row */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: "Max Win Streak", value: "6" },
                { label: "Profit Factor",  value: "1.72" },
                { label: "Avg R per trade", value: "+0.38R" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-3 py-2.5">
                  <p className="text-[10px] text-zinc-600">{s.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-zinc-200">{s.value}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </Section>
  );
}
