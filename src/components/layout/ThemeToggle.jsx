import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { useTheme } from "@/lib/theme";
import SelectField from "@/components/ui/select-field";

const icons = { light: Sun, dark: Moon, system: Monitor };
export default function ThemeToggle() {
  useLanguage();
  const [theme, setTheme] = useTheme();
  const { user, updatePreferences } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function changeTheme(value) {
    setError("");
    if (!user) {
      setTheme(value);
      return;
    }
    setBusy(true);
    try {
      await updatePreferences({ theme: value });
      setTheme(value);
    } catch {
      setError("Couldn’t save theme. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const Icon = icons[theme];
  return (
    <div className="relative flex items-center gap-2">
      <Icon aria-hidden="true" className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
      <SelectField
        label={t("Theme")}
        translateOptions
        value={theme}
        onValueChange={changeTheme}
        disabled={busy}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ]}
        allowClear={false}
        className="h-9 w-16 sm:w-28"
      />
      {error && <p role="alert" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-lg">{t(error)}</p>}
    </div>
  );
}
