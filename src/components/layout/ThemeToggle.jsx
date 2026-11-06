import { translate as t } from "@/i18n/language";
import { useLanguage } from "@/i18n/useLanguage";
import { Monitor, Moon, Sun } from "lucide-react";
import { DropdownMenu as Menu } from "radix-ui";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const icons = { light: Sun, dark: Moon, system: Monitor };
const labels = { light: "Light", dark: "Dark", system: "System" };
export default function ThemeToggle() {
  useLanguage();
  const [theme, setTheme] = useTheme();
  const Icon = icons[theme];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={t("Theme")}
          title={`${t("Theme")}: ${t(labels[theme])}`}
          className="h-9 w-9 shrink-0 px-0"
        >
          <Icon aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Menu.RadioGroup aria-label={t("Theme")} value={theme} onValueChange={setTheme}>
          {Object.entries(icons).map(([value, OptionIcon]) => (
            <Menu.RadioItem
              key={value}
              value={value}
              className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none focus:bg-primary/10 focus:text-primary data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary"
            >
              <OptionIcon aria-hidden="true" className="size-4" />
              {t(labels[value])}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
