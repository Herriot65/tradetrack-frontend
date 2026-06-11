import {
  BookOpen,
  LineChart,
  TrendingUp,
  Brain,
  Upload,
  BarChart3,
  Target,
} from "lucide-react";

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export const features = [
  {
    icon: BookOpen,
    title: "Trade Journaling",
    description:
      "Log every trade with tags, notes, and screenshots. Build a searchable history that reveals your edge.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description:
      "Win rate, profit factor, R-multiples, and session breakdowns — all computed automatically from your journal.",
  },
  {
    icon: TrendingUp,
    title: "Equity Curve",
    description:
      "Visualize your account growth over time with drawdown overlays and benchmark comparisons.",
  },
  {
    icon: Brain,
    title: "Psychology Tracking",
    description:
      "Rate your emotional state before and after trades. Spot patterns between mindset and performance.",
  },
];

export const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Import or log trades",
    description:
      "Connect your broker or manually journal trades in seconds with our streamlined entry form.",
  },
  {
    icon: LineChart,
    step: "02",
    title: "Analyze performance",
    description:
      "Instant dashboards surface your best setups, worst habits, and key metrics at a glance.",
  },
  {
    icon: Target,
    step: "03",
    title: "Track psychology",
    description:
      "Log pre-trade confidence and post-trade emotions to uncover behavioral edges and leaks.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Improve consistently",
    description:
      "Set goals, review weekly reports, and iterate on your process with data-backed insights.",
  },
];

export const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with trade journaling.",
    features: [
      "Up to 50 trades/month",
      "Basic analytics dashboard",
      "Equity curve chart",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For serious traders who want the full toolkit.",
    features: [
      "Unlimited trades",
      "Advanced analytics & filters",
      "Psychology tracking",
      "Weekly performance reports",
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
