import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function FeatureCard({ icon: Icon, title, description, className }) {
  return (
    <Card
      className={cn(
        "group border-zinc-800/80 bg-zinc-900/50 py-0 ring-zinc-800/60 backdrop-blur-sm transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/80",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="mb-4 inline-flex rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400 transition-colors group-hover:border-emerald-500/40 group-hover:bg-emerald-500/15">
          <Icon className="size-5" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      </CardContent>
    </Card>
  );
}
