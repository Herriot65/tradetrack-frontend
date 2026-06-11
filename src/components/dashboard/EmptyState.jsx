import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export default function EmptyState({ title, description, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 px-4 py-10 text-center",
        className
      )}
    >
      <Inbox className="size-8 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
