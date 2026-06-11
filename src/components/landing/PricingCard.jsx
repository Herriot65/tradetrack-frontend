import { Link } from "react-router-dom";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlighted = false,
}) {
  return (
    <Card
      className={cn(
        "relative flex flex-col border-zinc-800/80 bg-zinc-900/50 py-0 ring-zinc-800/60 backdrop-blur-sm",
        highlighted &&
          "border-emerald-500/40 bg-zinc-900/80 shadow-lg shadow-emerald-500/10 ring-emerald-500/20"
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-black">
          Most Popular
        </div>
      )}

      <CardHeader className="border-b border-zinc-800/60 pb-6">
        <p className="text-sm font-medium text-zinc-400">{name}</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight text-white">
            {price}
          </span>
          {period && (
            <span className="text-sm text-zinc-500">/ {period}</span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 py-6">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="border-t border-zinc-800/60 bg-transparent pt-6">
        <Button
          asChild
          className="w-full"
          variant={highlighted ? "default" : "outline"}
          size="lg"
        >
          <Link to="/register">{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
