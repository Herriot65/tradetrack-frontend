import {
  BookOpen,
  LineChart,
  BarChart3,
  Clock,
  Upload,
  TrendingUp,
  Target,
  Flame,
} from "lucide-react";

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export const features = [
  {
    icon: BookOpen,
    title: "Multi-journal Trade Logging",
    description:
      "Keep separate journals for live, demo, or backtesting. Log trades with asset, entry & exit, R-multiple, setup tags, and notes — then search and filter your full history in seconds.",
  },
  {
    icon: BarChart3,
    title: "Full Analytics Suite",
    description:
      "Equity curve, drawdown chart, R-per-trade waterfall, win/loss distribution, profit factor, max streaks, and expectancy — all computed automatically from your trade log.",
  },
  {
    icon: Clock,
    title: "Time-Based Performance",
    description:
      "Discover exactly which days of the week and hours of the day you trade best. Heatmap calendar and session breakdowns surface patterns invisible to the naked eye.",
  },
  {
    icon: Upload,
    title: "MT5 One-Click Import",
    description:
      "Import your full MetaTrader 5 trading history in seconds. Trades are mapped automatically — no spreadsheet wrangling, no manual entry.",
  },
];

export const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Import or log trades",
    description:
      "Import your MT5 history with one click, or manually journal trades using our streamlined entry form with R-multiple, setup tags, and notes.",
  },
  {
    icon: LineChart,
    step: "02",
    title: "See your analytics instantly",
    description:
      "Your equity curve, drawdown chart, win rate, profit factor, and career-level streak stats appear the moment your first trade lands.",
  },
  {
    icon: Target,
    step: "03",
    title: "Find your edge",
    description:
      "Heatmaps, day-of-week charts, and hourly breakdowns reveal which setups, sessions, and instruments actually drive your results.",
  },
  {
    icon: Flame,
    step: "04",
    title: "Compound the advantage",
    description:
      "Track expectancy and average R across years. Filter by year, review per-period stats, and iterate on your process with hard numbers.",
  },
];

export const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started and stay consistent.",
    features: [
      "1 trading journal",
      "Unlimited trade logging",
      "Full analytics dashboard",
      "Equity curve & drawdown",
      "MT5 import",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For serious traders who want the complete picture.",
    features: [
      "Unlimited journals",
      "Career analytics (all-time streaks, expectancy)",
      "Performance by day & hour",
      "Multi-year heatmap & filters",
      "R-breakdown by asset & setup",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For prop firms and trading teams at scale.",
    features: [
      "Everything in Pro",
      "Team dashboards",
      "Custom integrations",
      "Dedicated account manager",
      "SLA & onboarding",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};
