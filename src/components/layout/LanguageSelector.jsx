import { Globe } from "lucide-react";
import { LANGUAGES } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import SelectField from "@/components/ui/select-field";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const selected = LANGUAGES.find(option => option.value === language);
  return <SelectField label={t("Select language")} title={`${t("Language")}: ${selected.label}`} value={language} onValueChange={setLanguage} options={LANGUAGES} allowClear={false} className="h-9 w-auto shrink-0 gap-1.5 px-2 text-xs" displayValue={<span className="flex items-center gap-1.5"><Globe aria-hidden="true" className="size-3.5 shrink-0" />{selected.code}</span>} />;
}
