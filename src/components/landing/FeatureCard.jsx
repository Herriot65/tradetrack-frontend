import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
export default function FeatureCard({ icon: Icon, title, description, className }) {
  useLanguage();
  return (
    <article
      className={cn(
        "group relative rounded-xl border border-border/60 bg-card/70 p-6 transition-colors hover:border-primary/25 sm:p-8",
        className,
      )}
    >
      <div className="mb-7 flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.06] text-primary">
          <Icon className="size-[18px]" />
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 text-zinc-700 transition-colors group-hover:text-primary"
        />
      </div>
      <h3 className="text-[18px] font-medium tracking-[-0.025em]">{t(title)}</h3>
      <p className="mt-3 max-w-lg text-[13px] leading-7 text-muted-foreground">{t(description)}</p>
    </article>
  );
}
