import { Globe } from "lucide-react";
import { LANGUAGES } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const selected = LANGUAGES.find((option) => option.value === language);
  return (
    <label className="relative flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-muted-foreground focus-within:ring-2 focus-within:ring-primary/40">
      <Globe aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="sr-only">{t("Language")}</span>
      <span aria-hidden="true" className="sm:hidden">{selected.code}</span>
      <span aria-hidden="true" className="hidden sm:inline">{selected.label}</span>
      <select
        aria-label={t("Select language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {LANGUAGES.map((option) => (
          <option key={option.value} value={option.value} lang={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
