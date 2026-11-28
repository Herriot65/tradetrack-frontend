import { BookOpen, LineChart, BarChart3, Clock, Upload, Target } from "lucide-react";

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

export const features = [
  {
    icon: BookOpen,
    title: "Multi-journal Trade Logging",
    description: "Separate live, demo, and backtesting journals. Record each trade and find it quickly with search and filters.",
  },
  {
    icon: BarChart3,
    title: "Full Analytics Suite",
    description: "Track equity, drawdown, win rate, expectancy, and R per trade in one clear view.",
  },
  {
    icon: Clock,
    title: "Time-Based Performance",
    description: "Compare results by day, hour, and session to see when your strategy performs best.",
  },
  {
    icon: Upload,
    title: "MT5 One-Click Import",
    description: "Bring your MetaTrader 5 history into Nexora without spreadsheet cleanup or manual entry.",
  },
];

export const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Import or log trades",
    description: "Import your MT5 history or add trades manually. Keep entries, exits, setups, and notes together.",
  },
  {
    icon: LineChart,
    step: "02",
    title: "See your analytics instantly",
    description: "Review equity, drawdown, win rate, and performance by setup or session.",
  },
  {
    icon: Target,
    step: "03",
    title: "Find your edge",
    description: "Use patterns in your history to make better-informed trading decisions.",
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
    { label: "How it works", href: "#how-it-works" },
  ],
};
