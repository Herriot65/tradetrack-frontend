import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiCard({ label, icon: Icon, value, loading }) {
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/40">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {label}
          </span>
          {Icon && <Icon className="size-3.5 text-zinc-700" />}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight text-zinc-200">
            {value ?? "—"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
