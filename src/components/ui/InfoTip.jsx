import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export default function InfoTip({ text, label }) {
  useLanguage();
  if (!text) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label ? `${t("About")} ${t(label)}` : t("About")}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info aria-hidden="true" className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-w-[calc(100vw-2rem)] w-72 border-hairline bg-surface-card text-ink shadow-lg"
      >
        {label && <p className="mb-1 text-xs font-semibold">{t(label)}</p>}
        <p className="text-xs leading-relaxed">{t(text)}</p>
      </PopoverContent>
    </Popover>
  );
}
