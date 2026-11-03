import { cn } from "@/lib/utils";

export default function AnalyticsCard({ className, children }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-hairline bg-surface-card",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeading({ title, detail, action, className }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-4 pt-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[14px] font-medium leading-5 text-ink">{title}</h2>
        {detail && (
          <p className="mt-0.5 text-[11px] leading-4 text-ink-muted">{detail}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SegmentedControl({ options, value, onChange, className, label }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-hairline bg-surface-card p-0.5",
        className,
      )}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onKeyDown={event => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                const current = options.findIndex(item => item.value === option.value);
                const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
                onChange(options[next].value);
                event.currentTarget.parentElement.children[next].focus();
              }
            }}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-6 rounded-md px-2 text-[12px] font-normal transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/20",
              active
                ? "bg-surface-raised text-ink ring-1 ring-inset ring-hairline-strong"
                : "text-ink-muted hover:text-ink-secondary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyChart({ children, className }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[120px] items-center justify-center px-6 text-center text-[11px] text-ink-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}

