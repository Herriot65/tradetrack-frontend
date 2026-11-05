import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export function FormErrorBanner({ message, className }) {
  useLanguage();
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive",
        className
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{t(message)}</p>
    </div>
  );
}
