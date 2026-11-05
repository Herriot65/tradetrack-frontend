import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { cn } from "@/lib/utils";

export default function Section({ id, children, className, containerClassName }) {
  useLanguage();
  return (
    <section id={id} className={cn("relative py-20 md:py-24", className)}>
      <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", containerClassName)}>
        {children}
      </div>
    </section>
  );
}

export function SectionHeader({ eyebrow, title, description, className, align = "center" }) {
  useLanguage();
  const alignClass = align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left";

  return (
    <div className={cn("mb-10 md:mb-12", alignClass, className)}>
      {eyebrow && <p className="nx-eyebrow mb-4">{eyebrow}</p>}
      <h2 className="nx-section-heading text-3xl font-medium tracking-[-0.04em] text-foreground sm:text-4xl">
        {t(title)}
      </h2>
      {description && (
        <p className="mt-4 text-[14px] leading-7 text-muted-foreground">{t(description)}</p>
      )}
    </div>
  );
}
