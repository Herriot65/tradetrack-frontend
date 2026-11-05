import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
export function FieldError({ message }) {
  useLanguage();
  if (!message) return null;

  return (
    <p className="text-sm text-destructive" role="alert">
      {t(message)}
    </p>
  );
}
